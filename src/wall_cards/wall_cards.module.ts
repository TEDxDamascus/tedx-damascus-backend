import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '../categories/entities/category.entity';
import {
  WallAnswer,
  WallAnswerSchema,
} from './entities/wall-answer.entity';
import {
  WallBlockedWord,
  WallBlockedWordSchema,
} from './entities/wall-blocked-word.entity';
import {
  WallQuestion,
  WallQuestionSchema,
} from './entities/wall-question.entity';
import { WallCardsController } from './wall_cards.controller';
import { WallCardsService } from './wall_cards.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WallQuestion.name, schema: WallQuestionSchema },
      { name: WallAnswer.name, schema: WallAnswerSchema },
      { name: WallBlockedWord.name, schema: WallBlockedWordSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [WallCardsController],
  providers: [WallCardsService],
  exports: [WallCardsService],
})
export class WallCardsModule {}
