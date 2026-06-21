import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsMongoId } from 'class-validator';
import { MAX_FEATURED_ANSWERS } from '../constants/wall-cards.constants';

export class SetFeaturedAnswersDto {
  @ApiProperty({ type: [String], maxItems: MAX_FEATURED_ANSWERS })
  @IsArray()
  @ArrayMaxSize(MAX_FEATURED_ANSWERS)
  @IsMongoId({ each: true })
  answerIds: string[];
}
