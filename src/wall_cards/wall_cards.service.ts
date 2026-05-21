import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { buildPaginatedResult } from '../common/pagination/utils/pagination.util';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { PaginatedResult } from '../common/pagination/interfaces/paginated-result.interface';
import { Category, CategoryDocument } from '../categories/entities/category.entity';
import { CreateWallAnswerDto } from './dto/create-wall-answer.dto';
import { PublishWallQuestionDto } from './dto/publish-wall-question.dto';
import { WallAnswerQueryDto } from './dto/wall-answer-query.dto';
import { WallQuestionQueryDto } from './dto/wall-question-query.dto';
import {
  WallAnswer,
  WallAnswerDocument,
  WallAnswerStatus,
} from './entities/wall-answer.entity';
import {
  WallQuestion,
  WallQuestionDocument,
  WallQuestionStatus,
} from './entities/wall-question.entity';
import { normalizeTags } from './utils/normalize-tags.util';
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
    @InjectConnection()
    private readonly connection: Connection,
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
    const session = await this.connection.startSession();

    try {
      let created: WallQuestionDocument;

      await session.withTransaction(async () => {
        const previousActive = await this.questionModel
          .findOne({ status: 'active' })
          .session(session)
          .exec();

        const newQuestion = new this.questionModel({
          text: dto.text,
          expiresAt,
          categoryId: dto.categoryId
            ? new Types.ObjectId(dto.categoryId)
            : undefined,
          tags,
          status: 'active',
          publishedAt: now,
          publishedBy: new Types.ObjectId(adminUserId),
        });

        created = await newQuestion.save({ session });

        if (previousActive) {
          previousActive.status = 'archived';
          previousActive.archivedAt = now;
          previousActive.replacedByQuestionId = created._id;
          await previousActive.save({ session });

          await this.answerModel
            .updateMany(
              {
                questionId: previousActive._id,
                status: 'pending',
              },
              { $set: { status: 'archived' as WallAnswerStatus } },
            )
            .session(session)
            .exec();
        }
      });

      const message = await this.t(lang, 'success.PUBLISHED');
      return {
        message,
        data: mapWallQuestion(created!, lang),
      };
    } finally {
      await session.endSession();
    }
  }

  async getCurrent(
    lang: string,
    pagination: OffsetPaginationDto,
  ): Promise<{
    question: WallQuestionResponse;
    answers: PaginatedResult<WallAnswerResponse>;
  }> {
    const questionDoc = await this.findActiveQuestionDocument(lang);
    const question = mapWallQuestion(questionDoc, lang);
    const answers = await this.listAnswersForQuestion(
      question.id,
      pagination,
      'public',
    );

    return { question, answers };
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

    const filter: FilterQuery<WallAnswerDocument> = {
      status: 'pending',
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

  private async findActiveQuestionDocument(
    lang: string,
  ): Promise<WallQuestionDocument> {
    let question = await this.questionModel.findOne({ status: 'active' }).exec();

    if (!question) {
      throw new NotFoundException(
        await this.t(lang, 'errors.NO_ACTIVE_QUESTION'),
      );
    }

    question = await this.expireActiveIfNeeded(question);

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
  ): FilterQuery<WallQuestionDocument> {
    const filter: FilterQuery<WallQuestionDocument> = {
      status: query.status ?? { $in: statuses },
    };

    if (query.from || query.to) {
      filter.publishedAt = {};
      if (query.from) {
        filter.publishedAt.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.publishedAt.$lte = new Date(query.to);
      }
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
    filter: FilterQuery<WallQuestionDocument>,
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

    const filter: FilterQuery<WallAnswerDocument> = {
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
