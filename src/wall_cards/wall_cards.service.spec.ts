import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Types } from 'mongoose';
import { WallCardsService } from './wall_cards.service';
import { WallQuestion } from './entities/wall-question.entity';
import { WallAnswer } from './entities/wall-answer.entity';
import { WallBlockedWord } from './entities/wall-blocked-word.entity';
import { Category } from '../categories/entities/category.entity';

const questionId = new Types.ObjectId();
const answerId1 = new Types.ObjectId();
const answerId2 = new Types.ObjectId();

const activeQuestion = {
  _id: questionId,
  id: questionId.toString(),
  text: { en: 'Question?', ar: 'سؤال؟' },
  expiresAt: new Date(Date.now() + 86_400_000),
  tags: [],
  status: 'active',
  publishedAt: new Date(),
  featuredAnswerIds: [],
  save: jest.fn().mockResolvedValue(undefined),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQuestionModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
};

const mockAnswerModel = {
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  updateMany: jest.fn(),
};

const mockBlockedWordModel = {
  find: jest.fn(),
  create: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

const mockCategoryModel = {
  findById: jest.fn(),
};

const mockI18n = {
  translate: jest.fn((key: string) => Promise.resolve(key)),
};

describe('WallCardsService', () => {
  let service: WallCardsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    activeQuestion.status = 'active';
    activeQuestion.featuredAnswerIds = [];
    activeQuestion.save.mockResolvedValue(activeQuestion);

    mockQuestionModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ ...activeQuestion }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WallCardsService,
        { provide: getModelToken(WallQuestion.name), useValue: mockQuestionModel },
        { provide: getModelToken(WallAnswer.name), useValue: mockAnswerModel },
        {
          provide: getModelToken(WallBlockedWord.name),
          useValue: mockBlockedWordModel,
        },
        { provide: getModelToken(Category.name), useValue: mockCategoryModel },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();

    service = module.get<WallCardsService>(WallCardsService);
  });

  describe('getCurrent', () => {
    it('returns featured public answers in admin order', async () => {
      const featuredIds = [answerId2, answerId1];
      const questionWithFeatured = {
        ...activeQuestion,
        featuredAnswerIds: featuredIds,
      };

      mockQuestionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(questionWithFeatured),
      });

      const answerOne = {
        _id: answerId1,
        id: answerId1.toString(),
        questionId,
        text: 'first',
        status: 'public',
        submittedAt: new Date('2026-01-01'),
      };
      const answerTwo = {
        _id: answerId2,
        id: answerId2.toString(),
        questionId,
        text: 'second',
        status: 'public',
        submittedAt: new Date('2026-01-02'),
      };

      mockAnswerModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([answerOne, answerTwo]),
      });

      const result = await service.getCurrent('en');

      expect(result.answers).toHaveLength(2);
      expect(result.answers[0].id).toBe(answerId2.toString());
      expect(result.answers[1].id).toBe(answerId1.toString());
    });

    it('falls back to 3 oldest public answers when none selected', async () => {
      mockAnswerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                _id: answerId1,
                id: answerId1.toString(),
                questionId,
                text: 'oldest',
                status: 'public',
                submittedAt: new Date('2026-01-01'),
              },
            ]),
          }),
        }),
      });

      const result = await service.getCurrent('en');

      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].text).toBe('oldest');
      expect(mockAnswerModel.find).toHaveBeenCalledWith({
        questionId,
        status: 'public',
      });
    });
  });

  describe('setFeaturedAnswers', () => {
    it('rejects invalid featured answer ids', async () => {
      mockAnswerModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await expect(
        service.setFeaturedAnswers(
          { answerIds: [answerId1.toString()] },
          'en',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('submitAnswer', () => {
    it('rejects answers containing blocked words', async () => {
      mockBlockedWordModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([{ word: 'spam' }]),
          }),
        }),
      });

      await expect(
        service.submitAnswer({ text: 'this is spam here' }, 'en'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates answer when text is clean', async () => {
      mockBlockedWordModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockAnswerModel.create.mockResolvedValue({
        id: answerId1.toString(),
        questionId,
        text: 'clean',
        status: 'pending',
        submittedAt: new Date(),
      });

      const result = await service.submitAnswer({ text: 'clean answer' }, 'en');

      expect(result.data.text).toBe('clean');
      expect(mockAnswerModel.create).toHaveBeenCalled();
    });
  });

  describe('addBlockedWord', () => {
    it('rejects duplicate Latin words case-insensitively', async () => {
      mockBlockedWordModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([{ word: 'spam' }]),
          }),
        }),
      });

      await expect(
        service.addBlockedWord({ word: 'SPAM' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a new blocked word', async () => {
      mockBlockedWordModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockBlockedWordModel.create.mockResolvedValue({
        id: 'blocked-id',
        word: 'spam',
        createdAt: new Date(),
      });

      const result = await service.addBlockedWord({ word: 'spam' });

      expect(result.word).toBe('spam');
    });
  });

  describe('removeBlockedWord', () => {
    it('throws when word not found', async () => {
      mockBlockedWordModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.removeBlockedWord(new Types.ObjectId().toString()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
