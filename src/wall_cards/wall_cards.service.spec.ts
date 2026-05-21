import { Test, TestingModule } from '@nestjs/testing';
import { WallCardsService } from './wall_cards.service';

describe('WallCardsService', () => {
  let service: WallCardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WallCardsService],
    }).compile();

    service = module.get<WallCardsService>(WallCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
