import {
  IsEnum,
  IsInt,
  IsOptional,
  IsObject,
  Min,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I18nDto } from './i18n.dto';
import { TARGET_ROLES } from '../entities/form-template.schema';

export class CreateFormTemplateDto {
  @ApiProperty({
    type: I18nDto,
    description: 'Localized form name with English and Arabic variants.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  name: I18nDto;

  @ApiPropertyOptional({
    type: I18nDto,
    description: 'Optional localized description shown above the form.',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  description?: I18nDto;

  @ApiProperty({
    enum: TARGET_ROLES,
    description: 'Target role that should see this form (Speaker, Partner, Attender).',
  })
  @IsEnum(TARGET_ROLES)
  targetRole: (typeof TARGET_ROLES)[number];

  @ApiPropertyOptional({
    description: 'Submission window opens at this instant (ISO 8601).',
    example: '2026-04-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @ApiPropertyOptional({
    description: 'Submission window closes after this instant (ISO 8601).',
    example: '2026-04-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  ends_at?: string;

  @ApiPropertyOptional({
    description:
      'After this instant the form is expired (410 on submit). Distinct from ends_at when both set.',
    example: '2026-05-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @ApiPropertyOptional({
    description: 'Maximum total submissions across all users. Omit for no limit.',
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_submissions?: number;
}
