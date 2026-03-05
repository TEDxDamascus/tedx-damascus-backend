import { Test, TestingModule } from '@nestjs/testing';
import { SpeakersController } from './speakers.controller';
import { SpeakersService } from './speakers.service';

describe('SpeakersController', () => {
  let controller: SpeakersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpeakersController],
      providers: [SpeakersService],
    }).compile();

    controller = module.get<SpeakersController>(SpeakersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
