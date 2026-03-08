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
  @ApiProperty({ type: I18nDto })
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  name: I18nDto;

  @ApiPropertyOptional({ type: I18nDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  description?: I18nDto;

  @ApiProperty({ enum: TARGET_ROLES })
  @IsEnum(TARGET_ROLES)
  targetRole: (typeof TARGET_ROLES)[number];
}
