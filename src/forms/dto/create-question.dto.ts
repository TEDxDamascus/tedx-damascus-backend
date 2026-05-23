import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I18nDto } from './i18n.dto';
import {
  QUESTION_TYPES,
  QUESTION_TYPE_VALUES,
} from '../entities/form-question.schema';
import { CreateOptionDto } from './create-option.dto';

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Zero-based index controlling question order within the form.',
    example: 0,
  })
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiProperty({
    enum: QUESTION_TYPES,
    enumName: 'QuestionTypesEnum',
    description:
      'Question type. Supported: short_text, long_text, single_choice, checkbox_group, date, phone_number, url, rating, date_range, file_upload, section.',
  })
  @IsIn(QUESTION_TYPE_VALUES)
  type: (typeof QUESTION_TYPES)[number];

  @ApiPropertyOptional({
    description:
      'Parent section question id. Sibling orderIndex is scoped under the same parentId (null = root).',
  })
  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @IsMongoId()
  parentId?: string | null;

  @ApiProperty({
    type: I18nDto,
    description: 'Localized question title with English and Arabic variants.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  title: I18nDto;

  @ApiPropertyOptional({
    type: I18nDto,
    description: 'Optional localized helper text displayed under the title.',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  helpText?: I18nDto;

  @ApiPropertyOptional({
    default: false,
    description: 'If true, the user must answer this question to submit the form.',
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description:
      'Type-specific configuration. Examples: rating { min: 1, max: 5 }, date { min_date, max_date }, date_range { min_date, max_date }, checkbox_group { min_selected, max_selected }.',
    example: {
      min: 1,
      max: 5,
    },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: [CreateOptionDto],
    description:
      'Options to display. Required for single_choice and checkbox_group, ignored for other types.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
