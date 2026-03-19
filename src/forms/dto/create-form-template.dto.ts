import {
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
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
}
