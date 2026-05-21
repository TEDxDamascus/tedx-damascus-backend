import { Test, TestingModule } from '@nestjs/testing';
import { WallCardsController } from './wall_cards.controller';
import { WallCardsService } from './wall_cards.service';

describe('WallCardsController', () => {
  let controller: WallCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WallCardsController],
      providers: [WallCardsService],
    }).compile();

    controller = module.get<WallCardsController>(WallCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
