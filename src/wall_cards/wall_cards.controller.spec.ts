import { Test, TestingModule } from '@nestjs/testing';
import { WallCardsController } from './wall_cards.controller';
import { WallCardsService } from './wall_cards.service';

describe('WallCardsController', () => {
  let controller: WallCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WallCardsController],
      providers: [
        {
          provide: WallCardsService,
          useValue: {
            getCurrent: jest.fn(),
            submitAnswer: jest.fn(),
            listHistory: jest.fn(),
            listPublicAnswers: jest.fn(),
            setFeaturedAnswers: jest.fn(),
            listBlockedWords: jest.fn(),
            addBlockedWord: jest.fn(),
            removeBlockedWord: jest.fn(),
            publishQuestion: jest.fn(),
            listQuestionsAdmin: jest.fn(),
            listAnswersAdmin: jest.fn(),
            listPendingAnswers: jest.fn(),
            approveAnswer: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WallCardsController>(WallCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
