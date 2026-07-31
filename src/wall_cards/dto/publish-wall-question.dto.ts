import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidateNested,
} from 'class-validator';
import {
  AtLeastOneWallQuestionLangConstraint,
  WallQuestionTextDto,
} from './wall-question-text.dto';

export class PublishWallQuestionDto {
  @ApiProperty({ type: WallQuestionTextDto })
  @ValidateNested()
  @Type(() => WallQuestionTextDto)
  @Validate(AtLeastOneWallQuestionLangConstraint)
  text: WallQuestionTextDto;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 20 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}
