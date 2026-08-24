import { PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ServiceDto } from './service.dto';
import { CreatePartnerDto } from './create-partner.dto';

export class UpdatePartnerDto extends PartialType(
  OmitType(CreatePartnerDto, ['social_links', 'services'] as const),
) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  social_links?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];
}
