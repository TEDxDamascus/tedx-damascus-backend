import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { buildPaginatedResult } from '../common/pagination/utils/pagination.util';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { PaginatedResult } from '../common/pagination/interfaces/paginated-result.interface';
import { Category, CategoryDocument } from '../categories/entities/category.entity';
import { CreateWallAnswerDto } from './dto/create-wall-answer.dto';
import { CreateBlockedWordDto } from './dto/create-blocked-word.dto';
import { ModerateWallAnswerDto } from './dto/moderate-wall-answer.dto';
import { PublishWallQuestionDto } from './dto/publish-wall-question.dto';
import { SetFeaturedAnswersDto } from './dto/set-featured-answers.dto';
import { WallAnswerQueryDto } from './dto/wall-answer-query.dto';
import { WallQuestionQueryDto } from './dto/wall-question-query.dto';
import {
  WallAnswer,
  WallAnswerDocument,
  WallAnswerStatus,
} from './entities/wall-answer.entity';
import {
  WallBlockedWord,
  WallBlockedWordDocument,
} from './entities/wall-blocked-word.entity';
import {
  WallQuestion,
  WallQuestionDocument,
  WallQuestionStatus,
} from './entities/wall-question.entity';
import { normalizeTags } from './utils/normalize-tags.util';
import {
  blockedWordsMatch,
  containsBlockedWord,
  normalizeBlockedWordInput,
} from './utils/check-blocked-words.util';
import {
  mapWallAnswer,
  mapWallQuestion,
  WallAnswerResponse,
  WallQuestionResponse,
} from './utils/wall-cards.mapper';
import {
  throwIfAnswerNotApprovable,
  throwIfQuestionNotAcceptingAnswers,
} from './utils/wall-question-availability.util';

@Injectable()
export class WallCardsService {
  constructor(
    @InjectModel(WallQuestion.name)
    private readonly questionModel: Model<WallQuestionDocument>,
    @InjectModel(WallAnswer.name)
    private readonly answerModel: Model<WallAnswerDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(WallBlockedWord.name)
    private readonly blockedWordModel: Model<WallBlockedWordDocument>,
    private readonly i18n: I18nService,
  ) {}

  private t(lang: string, key: string): Promise<string> {
    return this.i18n.translate(`wall_cards.${key}`, { lang });
  }

  async publishQuestion(
    dto: PublishWallQuestionDto,
    adminUserId: string,
    lang: string,
  ): Promise<{ message: string; data: WallQuestionResponse }> {
    const expiresAt = new Date(dto.expiresAt);
    const now = new Date();

    if (expiresAt <= now) {
      throw new BadRequestException(
        await this.t(lang, 'errors.EXPIRES_AT_MUST_BE_FUTURE'),
      );
    }

    if (dto.categoryId) {
      const category = await this.categoryModel.findById(dto.categoryId).exec();
      if (!category) {
        throw new BadRequestException(
          await this.t(lang, 'errors.INVALID_CATEGORY'),
        );
      }
    }

    const tags = normalizeTags(dto.tags);
    const previousActive = await this.questionModel
      .findOne({ status: 'active' })
      .exec();

    // Archive the current active question first so the partial unique index
    // on status:'active' allows inserting the new one (no replica-set transaction).
    if (previousActive) {
      await this.answerModel
        .updateMany(
          {
            questionId: previousActive._id,
            status: 'pending',
          },
          { $set: { status: 'archived' as WallAnswerStatus } },
        )
        .exec();

      previousActive.status = 'archived';
      previousActive.archivedAt = now;
      await previousActive.save();
    }

    const created = await this.questionModel.create({
      text: dto.text,
      expiresAt,
      categoryId: dto.categoryId
        ? new Types.ObjectId(dto.categoryId)
        : undefined,
      tags,
      status: 'active',
      publishedAt: now,
      publishedBy: new Types.ObjectId(adminUserId),
      featuredAnswerIds: [],
    });

    if (previousActive) {
      previousActive.replacedByQuestionId = created._id;
      await previousActive.save();
    }

    const message = await this.t(lang, 'success.PUBLISHED');
    return {
      message,
      data: mapWallQuestion(created, lang),
    };
  }

  async getCurrent(lang: string): Promise<{
    question: WallQuestionResponse;
    answers: WallAnswerResponse[];
  }> {
    const questionDoc = await this.findActiveQuestionDocument(lang);
    const question = mapWallQuestion(questionDoc, lang);
    const answers = await this.resolveFeaturedAnswers(questionDoc);

    return { question, answers };
  }

  async setFeaturedAnswers(
    dto: SetFeaturedAnswersDto,
    lang: string,
  ): Promise<{
    message: string;
    data: { question: WallQuestionResponse; featuredAnswerIds: string[] };
  }> {
    const questionDoc = await this.findActiveQuestionDocument(lang);
    const answerIds = this.dedupePreserveOrder(dto.answerIds);

    if (answerIds.length > 3) {
      throw new BadRequestException(
        await this.t(lang, 'errors.TOO_MANY_FEATURED_ANSWERS'),
      );
    }

    if (answerIds.length > 0) {
      const objectIds = answerIds.map((id) => new Types.ObjectId(id));
      const count = await this.answerModel
        .countDocuments({
          _id: { $in: objectIds },
          questionId: questionDoc._id,
          status: 'public',
        })
        .exec();

      if (count !== answerIds.length) {
        throw new BadRequestException(
          await this.t(lang, 'errors.INVALID_FEATURED_ANSWERS'),
        );
      }

      questionDoc.featuredAnswerIds = objectIds;
    } else {
      questionDoc.featuredAnswerIds = [];
    }

    await questionDoc.save();

    const message = await this.t(lang, 'success.FEATURED_ANSWERS_UPDATED');
    const question = mapWallQuestion(questionDoc, lang);

    return {
      message,
      data: {
        question,
        featuredAnswerIds: question.featuredAnswerIds ?? [],
      },
    };
  }

  async listBlockedWords(): Promise<
    Array<{ id: string; word: string; createdAt: string }>
  > {
    const words = await this.blockedWordModel
      .find()
      .sort({ word: 1 })
      .exec();

    return words.map((entry) => ({
      id: entry.id,
      word: entry.word,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  async addBlockedWord(
    dto: CreateBlockedWordDto,
  ): Promise<{ id: string; word: string; createdAt: string }> {
    const word = normalizeBlockedWordInput(dto.word);

    if (!word) {
      throw new BadRequestException('Blocked word cannot be empty');
    }

    const existing = await this.blockedWordModel.find().select('word').lean().exec();
    const duplicate = existing.some((entry) =>
      blockedWordsMatch(entry.word, word),
    );

    if (duplicate) {
      throw new ConflictException('Blocked word already exists');
    }

    const created = await this.blockedWordModel.create({ word });

    return {
      id: created.id,
      word: created.word,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async removeBlockedWord(id: string): Promise<{ message: string }> {
    const deleted = await this.blockedWordModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException('Blocked word not found');
    }

    return { message: 'Blocked word removed successfully' };
  }

  async submitAnswer(
    dto: CreateWallAnswerDto,
    lang: string,
  ): Promise<{ message: string; data: WallAnswerResponse }> {
    const questionDoc = await this.findActiveQuestionDocument(lang);

    throwIfQuestionNotAcceptingAnswers(
      questionDoc,
      await this.t(lang, 'errors.QUESTION_EXPIRED'),
      await this.t(lang, 'errors.QUESTION_NOT_ACCEPTING_ANSWERS'),
    );

    const blockedWords = await this.blockedWordModel
      .find()
      .select('word')
      .lean()
      .exec();
    const wordList = blockedWords.map((entry) => entry.word);

    if (
      containsBlockedWord(
        dto.text.trim(),
        dto.displayName?.trim(),
        wordList,
      )
    ) {
      throw new BadRequestException(
        await this.t(lang, 'errors.BLOCKED_WORD_DETECTED'),
      );
    }

    const answer = await this.answerModel.create({
      questionId: questionDoc._id,
      text: dto.text.trim(),
      displayName: dto.displayName?.trim() || undefined,
      status: 'pending',
      submittedAt: new Date(),
    });

    const message = await this.t(lang, 'success.ANSWER_SUBMITTED');
    return {
      message,
      data: mapWallAnswer(answer),
    };
  }

  async listHistory(
    query: WallQuestionQueryDto,
    lang: string,
  ): Promise<PaginatedResult<WallQuestionResponse>> {
    const filter = this.buildQuestionFilter(query, ['archived', 'expired']);
    return this.paginateQuestions(filter, query, lang);
  }

  async listPublicAnswers(
    questionId: string,
    pagination: OffsetPaginationDto,
    lang: string,
  ): Promise<PaginatedResult<WallAnswerResponse>> {
    await this.findQuestionById(questionId, lang);
    return this.listAnswersForQuestion(questionId, pagination, 'public');
  }

  async listQuestionsAdmin(
    query: WallQuestionQueryDto,
    lang: string,
  ): Promise<PaginatedResult<WallQuestionResponse>> {
    const statuses = query.status
      ? [query.status]
      : (['active', 'archived', 'expired'] as WallQuestionStatus[]);
    const filter = this.buildQuestionFilter(query, statuses);
    return this.paginateQuestions(filter, query, lang);
  }

  async listAnswersAdmin(
    questionId: string,
    query: WallAnswerQueryDto,
    lang: string,
  ): Promise<PaginatedResult<WallAnswerResponse>> {
    await this.findQuestionById(questionId, lang);
    return this.listAnswersForQuestion(
      questionId,
      query,
      query.status,
    );
  }

  async listPendingAnswers(
    pagination: OffsetPaginationDto,
  ): Promise<PaginatedResult<WallAnswerResponse>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const moderatableQuestionIds = await this.questionModel
      .find({ status: { $in: ['active', 'expired'] } })
      .select('_id')
      .lean()
      .exec();

    const ids = moderatableQuestionIds.map((q) => q._id);

    const filter = {
      status: 'pending' as const,
      questionId: { $in: ids },
    };

    const [items, total] = await Promise.all([
      this.answerModel
        .find(filter)
        .sort({ submittedAt: -1 })
        .skip(pagination.skip)
        .limit(limit)
        .exec(),
      this.answerModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      items.map((a) => mapWallAnswer(a)),
      total,
      page,
      limit,
    );
  }

  async approveAnswer(
    answerId: string,
    adminUserId: string,
    lang: string,
  ): Promise<{ message: string; data: WallAnswerResponse }> {
    const answer = await this.answerModel.findById(answerId).exec();

    if (!answer) {
      throw new NotFoundException(
        await this.t(lang, 'errors.ANSWER_NOT_FOUND'),
      );
    }

    const questionDoc = await this.questionModel
      .findById(answer.questionId)
      .exec();

    if (!questionDoc) {
      throw new NotFoundException(
        await this.t(lang, 'errors.QUESTION_NOT_FOUND'),
      );
    }

    await this.expireActiveIfNeeded(questionDoc);

    throwIfAnswerNotApprovable(
      questionDoc.status,
      answer.status,
      await this.t(lang, 'errors.QUESTION_ARCHIVED'),
      await this.t(lang, 'errors.ANSWER_NOT_PENDING'),
    );

    answer.status = 'public';
    answer.approvedAt = new Date();
    answer.approvedBy = new Types.ObjectId(adminUserId);
    await answer.save();

    const message = await this.t(lang, 'success.ANSWER_APPROVED');
    return {
      message,
      data: mapWallAnswer(answer),
    };
  }

  async moderateAnswer(
    answerId: string,
    dto: ModerateWallAnswerDto,
    adminUserId: string,
    lang: string,
  ): Promise<{ message: string; data: WallAnswerResponse }> {
    const answer = await this.answerModel.findById(answerId).exec();

    if (!answer) {
      throw new NotFoundException(await this.t(lang, 'errors.ANSWER_NOT_FOUND'));
    }

    const questionDoc = await this.questionModel
      .findById(answer.questionId)
      .exec();

    if (!questionDoc) {
      throw new NotFoundException(
        await this.t(lang, 'errors.QUESTION_NOT_FOUND'),
      );
    }

    await this.expireActiveIfNeeded(questionDoc);

    throwIfAnswerNotApprovable(
      questionDoc.status,
      answer.status,
      await this.t(lang, 'errors.QUESTION_ARCHIVED'),
      await this.t(lang, 'errors.ANSWER_NOT_PENDING'),
    );

    if (dto.action === 'approve') {
      answer.status = 'public';
      answer.approvedAt = new Date();
      answer.approvedBy = new Types.ObjectId(adminUserId);
      await answer.save();

      return {
        message: await this.t(lang, 'success.ANSWER_APPROVED'),
        data: mapWallAnswer(answer),
      };
    }

    // decline
    answer.status = 'archived';
    answer.approvedAt = undefined;
    answer.approvedBy = undefined;
    await answer.save();

    return {
      message: await this.t(lang, 'success.ANSWER_DECLINED'),
      data: mapWallAnswer(answer),
    };
  }

  private dedupePreserveOrder(ids: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    }

    return result;
  }

  private async resolveFeaturedAnswers(
    questionDoc: WallQuestionDocument,
  ): Promise<WallAnswerResponse[]> {
    const questionId = questionDoc._id;

    if (questionDoc.featuredAnswerIds?.length > 0) {
      const answers = await this.answerModel
        .find({
          _id: { $in: questionDoc.featuredAnswerIds },
          questionId,
          status: 'public',
        })
        .exec();

      const answersById = new Map(
        answers.map((answer) => [answer.id, answer]),
      );

      const ordered: WallAnswerDocument[] = [];
      for (const id of questionDoc.featuredAnswerIds) {
        const answer = answersById.get(id.toString());
        if (answer) {
          ordered.push(answer);
        }
      }

      return ordered.slice(0, 3).map((answer) => mapWallAnswer(answer));
    }

    const fallback = await this.answerModel
      .find({ questionId, status: 'public' })
      .sort({ submittedAt: 1 })
      .limit(3)
      .exec();

    return fallback.map((answer) => mapWallAnswer(answer));
  }

  private async findActiveQuestionDocument(
    lang: string,
  ): Promise<WallQuestionDocument> {
    const found = await this.questionModel.findOne({ status: 'active' }).exec();

    if (!found) {
      throw new NotFoundException(
        await this.t(lang, 'errors.NO_ACTIVE_QUESTION'),
      );
    }

    const question = await this.expireActiveIfNeeded(found);

    if (question.status !== 'active') {
      throw new NotFoundException(
        await this.t(lang, 'errors.NO_ACTIVE_QUESTION'),
      );
    }

    return question;
  }

  private async expireActiveIfNeeded(
    question: WallQuestionDocument,
  ): Promise<WallQuestionDocument> {
    if (
      question.status === 'active' &&
      new Date() >= question.expiresAt
    ) {
      question.status = 'expired';
      await question.save();
    }
    return question;
  }

  private async findQuestionById(
    id: string,
    lang: string,
  ): Promise<WallQuestionDocument> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(
        await this.t(lang, 'errors.QUESTION_NOT_FOUND'),
      );
    }
    return question;
  }

  private buildQuestionFilter(
    query: WallQuestionQueryDto,
    statuses: WallQuestionStatus[],
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      status: query.status ?? { $in: statuses },
    };

    if (query.from || query.to) {
      const publishedAt: Record<string, Date> = {};
      if (query.from) {
        publishedAt.$gte = new Date(query.from);
      }
      if (query.to) {
        publishedAt.$lte = new Date(query.to);
      }
      filter.publishedAt = publishedAt;
    }

    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.tag) {
      const normalized = normalizeTags([query.tag]);
      if (normalized.length > 0) {
        filter.tags = normalized[0];
      }
    }

    return filter;
  }

  private async paginateQuestions(
    filter: Record<string, unknown>,
    query: OffsetPaginationDto,
    lang: string,
  ): Promise<PaginatedResult<WallQuestionResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [items, total] = await Promise.all([
      this.questionModel
        .find(filter)
        .sort({ publishedAt: -1 })
        .skip(query.skip)
        .limit(limit)
        .exec(),
      this.questionModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      items.map((q) => mapWallQuestion(q, lang)),
      total,
      page,
      limit,
    );
  }

  private async listAnswersForQuestion(
    questionId: string,
    pagination: OffsetPaginationDto,
    status?: WallAnswerStatus,
  ): Promise<PaginatedResult<WallAnswerResponse>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const filter: Record<string, unknown> = {
      questionId: new Types.ObjectId(questionId),
    };

    if (status) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      this.answerModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(limit)
        .exec(),
      this.answerModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      items.map((a) => mapWallAnswer(a)),
      total,
      page,
      limit,
    );
  }
}
