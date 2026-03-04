import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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
} from './entities/form-submission.schema';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { validateAnswers, normalizeAnswerValue } from './validators/answer.validator';
import { buildPaginatedResult } from '../common/pagination/utils/pagination.util';
import { PaginatedResult } from '../common/pagination/interfaces/paginated-result.interface';
import { FormQuestion } from './entities/form-question.schema';
import { QuestionOption } from './entities/question-option.schema';

@Injectable()
export class FormsService {
  constructor(
    @InjectModel(FormTemplate.name)
    private formTemplateModel: Model<FormTemplateDocument>,
    @InjectModel(FormSubmission.name)
    private formSubmissionModel: Model<FormSubmissionDocument>,
  ) {}

  async create(dto: CreateFormTemplateDto): Promise<FormTemplateDocument> {
    const created = new this.formTemplateModel({
      ...dto,
      status: 'Draft' as FormStatus,
    });
    return created.save();
  }

  async findAll(): Promise<FormTemplateDocument[]> {
    return this.formTemplateModel.find().sort({ createdAt: -1 }).exec();
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

  async update(
    id: string,
    dto: UpdateFormTemplateDto,
  ): Promise<FormTemplateDocument> {
    const template = await this.findOne(id);
    this.ensureDraft(template);
    Object.assign(template, dto);
    return template.save();
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    this.ensureDraft(template);
    await this.formTemplateModel.findByIdAndDelete(id).exec();
  }

  async addQuestion(
    formId: string,
    dto: CreateQuestionDto,
  ): Promise<FormTemplateDocument> {
    const template = await this.findOne(formId);
    this.ensureDraft(template);
    const question: Partial<FormQuestion> = {
      orderIndex: dto.orderIndex,
      type: dto.type,
      title: dto.title,
      helpText: dto.helpText,
      isRequired: dto.isRequired ?? false,
      config: dto.config ?? {},
      options: (dto.options ?? []).map((o) => ({
        orderIndex: o.orderIndex,
        label: o.label,
      } as QuestionOption)),
    };
    template.questions.push(question as FormQuestion);
    return template.save();
  }

  async updateQuestion(
    formId: string,
    questionId: string,
    dto: Partial<CreateQuestionDto>,
  ): Promise<FormTemplateDocument> {
    const template = await this.findOne(formId);
    this.ensureDraft(template);
    const idx = template.questions.findIndex(
      (q) => (q as { _id?: { toString(): string } })._id?.toString() === questionId,
    );
    if (idx === -1) {
      throw new NotFoundException('Question not found');
    }
    if (dto.orderIndex !== undefined) template.questions[idx].orderIndex = dto.orderIndex;
    if (dto.type !== undefined) template.questions[idx].type = dto.type;
    if (dto.title !== undefined) template.questions[idx].title = dto.title;
    if (dto.helpText !== undefined) template.questions[idx].helpText = dto.helpText;
    if (dto.isRequired !== undefined) template.questions[idx].isRequired = dto.isRequired;
    if (dto.config !== undefined) template.questions[idx].config = dto.config;
    if (dto.options !== undefined) {
      template.questions[idx].options = dto.options.map((o) => ({
        orderIndex: o.orderIndex,
        label: o.label,
      })) as unknown as QuestionOption[];
    }
    return template.save();
  }

  async removeQuestion(
    formId: string,
    questionId: string,
  ): Promise<FormTemplateDocument> {
    const template = await this.findOne(formId);
    this.ensureDraft(template);
    const idx = template.questions.findIndex(
      (q) => (q as { _id?: { toString(): string } })._id?.toString() === questionId,
    );
    if (idx === -1) {
      throw new NotFoundException('Question not found');
    }
    template.questions.splice(idx, 1);
    return template.save();
  }

  async publish(id: string): Promise<FormTemplateDocument> {
    const template = await this.findOne(id);
    this.ensureDraft(template);
    template.status = 'Published' as FormStatus;
    template.publishedAt = new Date();
    return template.save();
  }

  async unpublish(id: string): Promise<FormTemplateDocument> {
    const template = await this.findOne(id);
    if (template.status !== 'Published') {
      throw new BadRequestException('Form is not published');
    }
    template.status = 'Draft' as FormStatus;
    template.publishedAt = undefined;
    return template.save();
  }

  async getFormSchema(formId: string): Promise<object> {
    const template = await this.findOne(formId);
    if (template.status !== 'Published') {
      throw new BadRequestException('Form is not published');
    }
    return this.toFormSchema(template);
  }

  async listAvailableForms(userRole: TargetRole): Promise<object[]> {
    const templates = await this.formTemplateModel
      .find({ status: 'Published', targetRole: userRole })
      .sort({ publishedAt: -1 })
      .exec();
    return templates.map((t) => this.toFormSchemaSummary(t));
  }

  async submitForm(
    formId: string,
    userId: string,
    dto: SubmitFormDto,
  ): Promise<FormSubmissionDocument> {
    const template = await this.findOne(formId);
    if (template.status !== 'Published') {
      throw new BadRequestException('Form is not published');
    }
    const userObjectId = new Types.ObjectId(userId);
    const existing = await this.formSubmissionModel
      .findOne({
        formTemplateId: new Types.ObjectId(formId),
        userId: userObjectId,
      })
      .exec();
    if (existing) {
      throw new ConflictException('You have already submitted this form');
    }
    validateAnswers(template, dto.answers);
    const qWithId = template.questions as Array<
      FormQuestion & { _id: Types.ObjectId }
    >;
    const answers = qWithId
      .filter((q) => {
        const qId = q._id?.toString();
        return qId && dto.answers[qId] !== undefined && dto.answers[qId] !== '';
      })
      .map((q) => {
        const qId = q._id.toString();
        const raw = dto.answers[qId];
        const value = normalizeAnswerValue(
          q as { _id?: Types.ObjectId } & FormQuestion,
          raw,
        );
        return { questionId: q._id, value };
      });
    const submission = new this.formSubmissionModel({
      formTemplateId: formId,
      userId: userObjectId,
      status: 'submitted',
      submittedAt: new Date(),
      answers,
    });
    return submission.save();
  }

  async getMySubmission(
    formId: string,
    userId: string,
  ): Promise<{ schema: object; answers: Record<string, unknown> }> {
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
      throw new NotFoundException('You have not submitted this form');
    }
    const schema = this.toFormSchema(template);
    const answers: Record<string, unknown> = {};
    for (const a of submission.answers) {
      const qId = a.questionId?.toString();
      if (qId) {
        let v: unknown = a.value;
        if (v instanceof Date) v = v.toISOString();
        if (Array.isArray(v))
          v = v.map((x) => (x instanceof Types.ObjectId ? x.toString() : x));
        else if (v instanceof Types.ObjectId) v = v.toString();
        answers[qId] = v;
      }
    }
    return { schema, answers };
  }

  async listSubmissions(
    formId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<FormSubmissionDocument>> {
    await this.findOne(formId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.formSubmissionModel
        .find({ formTemplateId: new Types.ObjectId(formId) })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.formSubmissionModel
        .countDocuments({ formTemplateId: new Types.ObjectId(formId) })
        .exec(),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async getSubmission(
    formId: string,
    submissionId: string,
  ): Promise<{ schema: object; submission: FormSubmissionDocument }> {
    const template = await this.findOne(formId);
    if (!Types.ObjectId.isValid(submissionId)) {
      throw new BadRequestException('Invalid submission ID');
    }
    const submission = await this.formSubmissionModel
      .findOne({
        _id: new Types.ObjectId(submissionId),
        formTemplateId: new Types.ObjectId(formId),
      })
      .exec();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    const schema = this.toFormSchema(template);
    return { schema, submission };
  }

  private ensureDraft(template: FormTemplateDocument): void {
    if (template.status === 'Published') {
      throw new BadRequestException(
        'Cannot modify a published form. Unpublish first.',
      );
    }
  }

  private toFormSchema(template: FormTemplateDocument): object {
    return {
      id: template._id?.toString(),
      name: template.name,
      description: template.description,
      targetRole: template.targetRole,
      questions: template.questions
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((q) => ({
          id: (q as { _id?: { toString(): string } })._id?.toString(),
          orderIndex: q.orderIndex,
          type: q.type,
          title: q.title,
          helpText: q.helpText,
          isRequired: q.isRequired,
          config: q.config,
          options: (q.options ?? [])
            .slice()
            .sort(
              (a, b) =>
                (a as { orderIndex: number }).orderIndex -
                (b as { orderIndex: number }).orderIndex,
            )
            .map((o) => ({
              id: (o as { _id?: Types.ObjectId })._id?.toString(),
              orderIndex: (o as { orderIndex: number }).orderIndex,
              label: (o as { label: { en: string; ar: string } }).label,
            })),
        })),
    };
  }

  private toFormSchemaSummary(template: FormTemplateDocument): object {
    return {
      id: template._id?.toString(),
      name: template.name,
      description: template.description,
      targetRole: template.targetRole,
      publishedAt: template.publishedAt,
    };
  }
}
