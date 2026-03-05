import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I18nDto } from './i18n.dto';
import { QUESTION_TYPES } from '../entities/form-question.schema';
import { CreateOptionDto } from './create-option.dto';

export class CreateQuestionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiProperty({ enum: QUESTION_TYPES })
  @IsEnum(QUESTION_TYPES)
  type: (typeof QUESTION_TYPES)[number];

  @ApiProperty({ type: I18nDto })
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  title: I18nDto;

  @ApiPropertyOptional({ type: I18nDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  helpText?: I18nDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [CreateOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
