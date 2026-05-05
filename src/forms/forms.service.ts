import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FormTemplate,
  FormTemplateDocument,
  FormStatus,
  TargetRole,
} from './entities/form-template.schema';
import {
  FormSubmission,
  FormSubmissionDocument,
  SubmissionStatus,
} from './entities/form-submission.schema';
import { SubmissionAnswer } from './entities/submission-answer.schema';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import {
  AnswerValidationError,
  validateAnswers,
  validateDraftAnswers,
  normalizeAnswerValue,
} from './validators/answer.validator';
import { buildPaginatedResult } from '../common/pagination/utils/pagination.util';
import { PaginatedResult } from '../common/pagination/interfaces/paginated-result.interface';
import { FormQuestion } from './entities/form-question.schema';
import { QuestionOption } from './entities/question-option.schema';
import {
  FormSubmissionResponse,
  FormTemplateSchemaResponse,
  FormTemplateSummaryResponse,
} from './interfaces/form-responses.interface';
import {
  mapFormSubmission,
  mapFormTemplateToSchema,
  mapFormTemplateToSummary,
} from './utils/form-mappers.util';
import {
  throwIfFormNotAcceptingSubmission,
  throwIfSubmissionCapReached,
} from './utils/form-availability.util';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FormsService {
  constructor(
    @InjectModel(FormTemplate.name)
    private formTemplateModel: Model<FormTemplateDocument>,
    @InjectModel(FormSubmission.name)
    private formSubmissionModel: Model<FormSubmissionDocument>,
    private configService: ConfigService,
    private storageService: StorageService,
  ) {}

  private getBaseUrl(): string {
    return (
      this.configService.get<string>('app.publicSiteUrl')?.replace(/\/$/, '') ||
      'http://localhost:3000'
    );
  }

  private slugifyFromName(name: string): string {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug || 'form';
  }

  private slugifyFromNameForAr(name: string): string {
    const slug = name
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug || 'form';
  }

  private buildShareableUrlForLocale(slugSegment: string): string {
    if (!slugSegment || !slugSegment.trim()) return '';
    const base = this.getBaseUrl();
    const encoded = encodeURIComponent(slugSegment.trim());
    return `${base}/apply/${encoded}`;
  }

  private buildShareableUrls(slug: {
    en?: string;
    ar?: string;
  }): { en: string; ar: string } {
    return {
      en: this.buildShareableUrlForLocale(slug?.en ?? ''),
      ar: this.buildShareableUrlForLocale(slug?.ar ?? ''),
    };
  }

  private async ensureUniqueSlugEn(
    base: string,
    excludeId?: Types.ObjectId,
  ): Promise<string> {
    if (!base?.trim()) return '';
    let candidate = base.trim();
    let n = 1;
    while (true) {
      const query: Record<string, unknown> = { 'slug.en': candidate };
      if (excludeId) query['_id'] = { $ne: excludeId };
      const exists = await this.formTemplateModel.findOne(query).exec();
      if (!exists) return candidate;
      candidate = `${base.trim()}-${++n}`;
    }
  }

  private async ensureUniqueSlugAr(
    base: string,
    excludeId?: Types.ObjectId,
  ): Promise<string> {
    if (!base?.trim()) return '';
    let candidate = base.trim();
    let n = 1;
    while (true) {
      const query: Record<string, unknown> = { 'slug.ar': candidate };
      if (excludeId) query['_id'] = { $ne: excludeId };
      const exists = await this.formTemplateModel.findOne(query).exec();
      if (!exists) return candidate;
      candidate = `${base.trim()}-${++n}`;
    }
  }

  async create(dto: CreateFormTemplateDto): Promise<FormTemplateSummaryResponse> {
    let slugEn = dto.slug?.en?.trim() ?? '';
    let slugAr = dto.slug?.ar?.trim() ?? '';
    if (slugEn) {
      slugEn = await this.ensureUniqueSlugEn(slugEn);
    }
    if (slugAr) {
      slugAr = await this.ensureUniqueSlugAr(slugAr);
    }
    const slug =
      slugEn || slugAr ? { en: slugEn, ar: slugAr } : undefined;
    let shareable_url: { en: string; ar: string } | undefined;
    if (slug) {
      shareable_url = this.buildShareableUrls({ en: slugEn, ar: slugAr });
    } else if (dto.shareable_url && (dto.shareable_url.en || dto.shareable_url.ar)) {
      shareable_url = {
        en: dto.shareable_url.en ?? '',
        ar: dto.shareable_url.ar ?? '',
      };
    }
    const created = new this.formTemplateModel({
      name: dto.name,
      description: dto.description,
      targetRole: dto.targetRole,
      starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
      ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
      expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
      max_submissions: dto.max_submissions,
      status: 'Draft' as FormStatus,
      ...(slug && { slug }),
      ...(shareable_url && { shareable_url }),
    });
    try {
      const saved = await created.save();
      return mapFormTemplateToSummary(saved);
    } catch (e) {
      this.handleSlugConflict(e);
    }
  }

  async findAll(): Promise<FormTemplateSummaryResponse[]> {
    const docs = await this.formTemplateModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => mapFormTemplateToSummary(d));
  }

  async findOne(id: string): Promise<FormTemplateDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid form template ID');
    }
    const doc = await this.formTemplateModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Form template not found');
    }
    return doc;
  }

  async findOneForAdmin(id: string): Promise<FormTemplateSummaryResponse> {
    const doc = await this.findOne(id);
    return mapFormTemplateToSummary(doc);
  }

  async update(
    id: string,
    dto: UpdateFormTemplateDto,
  ): Promise<FormTemplateSummaryResponse> {
    const template = await this.findOne(id);
    this.ensureDraft(template);
    const excludeId = new Types.ObjectId(id);
    if (dto.name !== undefined) template.name = dto.name as FormTemplate['name'];
    if (dto.description !== undefined) {
      template.description = dto.description as FormTemplate['description'];
    }
    if (dto.targetRole !== undefined) template.targetRole = dto.targetRole;
    if (dto.starts_at !== undefined) {
      template.starts_at = dto.starts_at ? new Date(dto.starts_at) : undefined;
    }
    if (dto.ends_at !== undefined) {
      template.ends_at = dto.ends_at ? new Date(dto.ends_at) : undefined;
    }
    if (dto.expires_at !== undefined) {
      template.expires_at = dto.expires_at ? new Date(dto.expires_at) : undefined;
    }
    if (dto.max_submissions !== undefined) {
      template.max_submissions = dto.max_submissions;
    }
    const currentSlugEn = template.slug?.en?.trim() ?? '';
    const currentSlugAr = template.slug?.ar?.trim() ?? '';
    const incomingSlugEn = dto.slug?.en?.trim() ?? '';
    const incomingSlugAr = dto.slug?.ar?.trim() ?? '';
    const slugEnChanged = dto.slug && 'en' in dto.slug && incomingSlugEn !== currentSlugEn;
    const slugArChanged = dto.slug && 'ar' in dto.slug && incomingSlugAr !== currentSlugAr;
    let finalSlugEn = currentSlugEn;
    let finalSlugAr = currentSlugAr;
    if (slugEnChanged && incomingSlugEn) {
      finalSlugEn = await this.ensureUniqueSlugEn(incomingSlugEn, excludeId);
      template.slug = template.slug ?? { en: '', ar: '' };
      template.slug.en = finalSlugEn;
    } else if (dto.slug?.en !== undefined) {
      template.slug = template.slug ?? { en: '', ar: '' };
      template.slug.en = incomingSlugEn;
      finalSlugEn = incomingSlugEn;
    }
    if (slugArChanged && incomingSlugAr) {
      finalSlugAr = await this.ensureUniqueSlugAr(incomingSlugAr, excludeId);
      template.slug = template.slug ?? { en: '', ar: '' };
      template.slug.ar = finalSlugAr;
    } else if (dto.slug?.ar !== undefined) {
      template.slug = template.slug ?? { en: '', ar: '' };
      template.slug.ar = incomingSlugAr;
      finalSlugAr = incomingSlugAr;
    }
    template.shareable_url = template.shareable_url ?? { en: '', ar: '' };
    if (slugEnChanged && finalSlugEn) {
      template.shareable_url.en = this.buildShareableUrlForLocale(finalSlugEn);
    } else if (dto.shareable_url?.en !== undefined && !slugEnChanged) {
      template.shareable_url.en = dto.shareable_url.en ?? '';
    }
    if (slugArChanged && finalSlugAr) {
      template.shareable_url.ar = this.buildShareableUrlForLocale(finalSlugAr);
    } else if (dto.shareable_url?.ar !== undefined && !slugArChanged) {
      template.shareable_url.ar = dto.shareable_url.ar ?? '';
    }
    try {
      const saved = await template.save();
      return mapFormTemplateToSummary(saved);
    } catch (e) {
      this.handleSlugConflict(e);
    }
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    this.ensureDraft(template);
    await this.formTemplateModel.findByIdAndDelete(id).exec();
  }

  async addQuestion(
    formId: string,
    dto: CreateQuestionDto,
  ): Promise<FormTemplateSchemaResponse> {
    const template = await this.findOne(formId);
    this.ensureDraft(template);
    const question: Partial<FormQuestion> = {
      orderIndex: dto.orderIndex,
      type: dto.type,
      title: dto.title,
      helpText: dto.helpText,
      isRequired: dto.isRequired ?? false,
      config: dto.config ?? {},
      options: (dto.options ?? []).map(
        (o) =>
          ({
            orderIndex: o.orderIndex,
            label: o.label,
          }) as QuestionOption,
      ),
    };
    template.questions.push(question as FormQuestion);
    const saved = await template.save();
    return mapFormTemplateToSchema(saved);
  }

  async updateQuestion(
    formId: string,
    questionId: string,
    dto: Partial<CreateQuestionDto>,
  ): Promise<FormTemplateSchemaResponse> {
    const template = await this.findOne(formId);
    this.ensureDraft(template);
    const idx = template.questions.findIndex(
      (q) =>
        (q as { _id?: { toString(): string } })._id?.toString() === questionId,
    );
    if (idx === -1) {
      throw new NotFoundException('Question not found');
    }
    if (dto.orderIndex !== undefined)
      template.questions[idx].orderIndex = dto.orderIndex;
    if (dto.type !== undefined) template.questions[idx].type = dto.type;
    if (dto.title !== undefined) template.questions[idx].title = dto.title;
    if (dto.helpText !== undefined)
      template.questions[idx].helpText = dto.helpText;
    if (dto.isRequired !== undefined)
      template.questions[idx].isRequired = dto.isRequired;
    if (dto.config !== undefined) template.questions[idx].config = dto.config;
    if (dto.options !== undefined) {
      template.questions[idx].options = dto.options.map((o) => ({
        orderIndex: o.orderIndex,
        label: o.label,
      })) as unknown as QuestionOption[];
    }
    const saved = await template.save();
    return mapFormTemplateToSchema(saved);
  }

  async removeQuestion(
    formId: string,
    questionId: string,
  ): Promise<FormTemplateSchemaResponse> {
    const template = await this.findOne(formId);
    this.ensureDraft(template);
    const idx = template.questions.findIndex(
      (q) =>
        (q as { _id?: { toString(): string } })._id?.toString() === questionId,
    );
    if (idx === -1) {
      throw new NotFoundException('Question not found');
    }
    template.questions.splice(idx, 1);
    const saved = await template.save();
    return mapFormTemplateToSchema(saved);
  }

  async publish(id: string): Promise<FormTemplateSummaryResponse> {
    const template = await this.findOne(id);
    this.ensureDraft(template);
    const excludeId = new Types.ObjectId(id);
    let slugEn = template.slug?.en?.trim() ?? '';
    let slugAr = template.slug?.ar?.trim() ?? '';
    if (!slugEn && template.name?.en) {
      const base = this.slugifyFromName(template.name.en);
      slugEn = await this.ensureUniqueSlugEn(base, excludeId);
    }
    if (!slugAr && template.name?.ar) {
      const base = this.slugifyFromNameForAr(template.name.ar);
      slugAr = await this.ensureUniqueSlugAr(base, excludeId);
    }
    if (slugEn || slugAr) {
      template.slug = { en: slugEn, ar: slugAr };
      template.shareable_url = this.buildShareableUrls({ en: slugEn, ar: slugAr });
    }
    template.status = 'Published' as FormStatus;
    template.publishedAt = new Date();
    try {
      const saved = await template.save();
      return mapFormTemplateToSummary(saved);
    } catch (e) {
      this.handleSlugConflict(e);
    }
  }

  async unpublish(id: string): Promise<FormTemplateSummaryResponse> {
    const template = await this.findOne(id);
    if (template.status !== 'Published') {
      throw new BadRequestException('Form is not published');
    }
    template.status = 'Draft' as FormStatus;
    template.publishedAt = undefined;
    const saved = await template.save();
    return mapFormTemplateToSummary(saved);
  }

  async getFormSchema(formId: string): Promise<FormTemplateSchemaResponse> {
    const template = await this.findOne(formId);
    if (template.status !== 'Published') {
      throw new BadRequestException('Form is not published');
    }
    return mapFormTemplateToSchema(template);
  }

  async listAvailableForms(
    userRole: TargetRole,
  ): Promise<FormTemplateSummaryResponse[]> {
    const templates = await this.formTemplateModel
      .find({ status: 'Published', targetRole: userRole })
      .sort({ publishedAt: -1 })
      .exec();
    return templates.map((t) => mapFormTemplateToSummary(t));
  }

  /**
   * Stores a file under users/{userId}/forms/{formId}/... without creating Media.
   * Call only when the form is accepting submissions (e.g. after FormAvailabilityGuard).
   */
  async uploadFormDocument(
    formId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    return this.storageService.uploadFormUserFile({ userId, formId, file });
  }

  async saveDraft(
    formId: string,
    userId: string,
    dto: SubmitFormDto,
  ): Promise<FormSubmissionResponse> {
    const template = await this.assertFormAcceptingSubmission(formId);
    const userObjectId = new Types.ObjectId(userId);
    const existing = await this.formSubmissionModel
      .findOne({
        formTemplateId: new Types.ObjectId(formId),
        userId: userObjectId,
      })
      .exec();
    if (existing && existing.status !== 'draft') {
      throw new ConflictException(
        'Cannot save draft after the form has been submitted',
      );
    }
    try {
      validateDraftAnswers(template, dto.answers);
    } catch (err) {
      if (err instanceof AnswerValidationError) {
        throw new BadRequestException({
          message: err.message,
          questionId: err.questionId,
        });
      }
      throw err;
    }
    const answers = this.buildNormalizedSubmissionAnswers(template, dto.answers);
    if (!existing) {
      const created = new this.formSubmissionModel({
        formTemplateId: formId,
        userId: userObjectId,
        status: 'draft',
        answers,
      });
      const saved = await created.save();
      return mapFormSubmission(saved);
    }
    existing.answers = answers;
    existing.status = 'draft';
    existing.submittedAt = undefined;
    const saved = await existing.save();
    return mapFormSubmission(saved);
  }

  async submitForm(
    formId: string,
    userId: string,
    dto: SubmitFormDto,
  ): Promise<FormSubmissionResponse> {
    const template = await this.assertFormAcceptingSubmission(formId);
    const userObjectId = new Types.ObjectId(userId);
    const existing = await this.formSubmissionModel
      .findOne({
        formTemplateId: new Types.ObjectId(formId),
        userId: userObjectId,
      })
      .exec();
    if (existing && existing.status !== 'draft') {
      throw new ConflictException('You have already submitted this form');
    }
    try {
      validateAnswers(template, dto.answers);
    } catch (err) {
      if (err instanceof AnswerValidationError) {
        throw new BadRequestException({
          message: err.message,
          questionId: err.questionId,
        });
      }
      throw err;
    }
    const answers = this.buildNormalizedSubmissionAnswers(template, dto.answers);
    const submittedCount = await this.countSubmissions(formId);
    throwIfSubmissionCapReached(template, submittedCount);

    if (existing?.status === 'draft') {
      existing.answers = answers;
      existing.status = 'submitted';
      existing.submittedAt = new Date();
      const saved = await existing.save();
      return mapFormSubmission(saved);
    }

    const submission = new this.formSubmissionModel({
      formTemplateId: formId,
      userId: userObjectId,
      status: 'submitted',
      submittedAt: new Date(),
      answers,
    });
    const saved = await submission.save();
    return mapFormSubmission(saved);
  }

  private buildNormalizedSubmissionAnswers(
    template: FormTemplateDocument,
    answers: Record<string, unknown>,
  ): SubmissionAnswer[] {
    const qWithId = template.questions as Array<
      FormQuestion & { _id: Types.ObjectId }
    >;
    return qWithId
      .filter((q) => {
        const qId = q._id?.toString();
        return qId && answers[qId] !== undefined && answers[qId] !== '';
      })
      .map((q) => {
        const qId = q._id.toString();
        const raw = answers[qId];
        const value = normalizeAnswerValue(
          q as { _id?: Types.ObjectId } & FormQuestion,
          raw,
        );
        return { questionId: q._id, value } as SubmissionAnswer;
      });
  }

  async getMySubmission(
    formId: string,
    userId: string,
  ): Promise<{
    schema: object;
    answers: Record<string, unknown>;
    status: SubmissionStatus;
  }> {
    const template = await this.findOne(formId);
    if (template.status !== 'Published') {
      throw new BadRequestException('Form is not published');
    }
    const submission = await this.formSubmissionModel
      .findOne({
        formTemplateId: new Types.ObjectId(formId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (!submission) {
      throw new NotFoundException(
        'You have no saved draft or submission for this form',
      );
    }
    const schema = mapFormTemplateToSchema(template);
    const answers: Record<string, unknown> = {};
    for (const a of submission.answers) {
      const qId = a.questionId?.toString();
      if (qId) {
        let v: unknown = a.value;
        if (v instanceof Date) v = v.toISOString();
        if (Array.isArray(v)) {
          v = v.map((x) => (x instanceof Types.ObjectId ? x.toString() : x));
        } else if (v instanceof Types.ObjectId) {
          v = v.toString();
        } else if (v && typeof v === 'object') {
          const obj = v as Record<string, unknown>;
          const result: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(obj)) {
            if (val instanceof Date) {
              result[key] = val.toISOString();
            } else if (val instanceof Types.ObjectId) {
              result[key] = val.toString();
            } else {
              result[key] = val;
            }
          }
          v = result;
        }
        answers[qId] = v;
      }
    }
    return {
      schema,
      answers,
      status: (submission.status ?? 'submitted') as SubmissionStatus,
    };
  }

  async listSubmissions(
    formId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<FormSubmissionResponse>> {
    await this.findOne(formId);
    const skip = (page - 1) * limit;
    const filter = {
      formTemplateId: new Types.ObjectId(formId),
      $or: [
        { status: 'submitted' },
        { status: { $exists: false } },
      ],
    };
    const [items, total] = await Promise.all([
      this.formSubmissionModel
        .find(filter)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.formSubmissionModel.countDocuments(filter).exec(),
    ]);
    const mappedItems = items.map((s) => mapFormSubmission(s));
    return buildPaginatedResult(mappedItems, total, page, limit);
  }

  async getSubmission(
    formId: string,
    submissionId: string,
  ): Promise<{
    schema: FormTemplateSchemaResponse;
    submission: FormSubmissionResponse;
  }> {
    const template = await this.findOne(formId);
    if (!Types.ObjectId.isValid(submissionId)) {
      throw new BadRequestException('Invalid submission ID');
    }
    const submission = await this.formSubmissionModel
      .findOne({
        _id: new Types.ObjectId(submissionId),
        formTemplateId: new Types.ObjectId(formId),
        $or: [
          { status: 'submitted' },
          { status: { $exists: false } },
        ],
      })
      .exec();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    const schema = mapFormTemplateToSchema(template);
    const mappedSubmission = mapFormSubmission(submission);
    return { schema, submission: mappedSubmission };
  }

  /**
   * Used by FormAvailabilityGuard and submit flow. Loads template + submission count and enforces rules.
   */
  async assertFormAcceptingSubmission(
    formId: string,
  ): Promise<FormTemplateDocument> {
    const template = await this.findOne(formId);
    const count = await this.countSubmissions(formId);
    throwIfFormNotAcceptingSubmission(template, count);
    return template;
  }

  private async countSubmissions(formId: string): Promise<number> {
    return this.formSubmissionModel
      .countDocuments({
        formTemplateId: new Types.ObjectId(formId),
        $or: [
          { status: 'submitted' },
          { status: { $exists: false } },
        ],
      })
      .exec();
  }

  private ensureDraft(template: FormTemplateDocument): void {
    if (template.status === 'Published') {
      throw new BadRequestException(
        'Cannot modify a published form. Unpublish first.',
      );
    }
  }

  private isMongoDuplicateKeyError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const code = (err as { code?: unknown }).code;
    return typeof code === 'number' && code === 11000;
  }

  private handleSlugConflict(err: unknown): never {
    if (this.isMongoDuplicateKeyError(err)) {
      throw new ConflictException(
        'A form with this slug already exists. Please use a different slug.',
      );
    }
    throw err;
  }
}
