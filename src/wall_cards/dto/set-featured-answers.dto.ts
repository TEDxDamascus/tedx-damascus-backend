import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsMongoId } from 'class-validator';

export class SetFeaturedAnswersDto {
  @ApiProperty({ type: [String], maxItems: 3 })
  @IsArray()
  @ArrayMaxSize(3)
  @IsMongoId({ each: true })
  answerIds: string[];
}
