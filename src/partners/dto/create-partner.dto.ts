import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { IsExistingMedia } from 'src/common/decorators/is-existing-media.decorator';
import { TranslationDto } from 'src/common/dto/translation.dto';
import { ServiceDto } from './service.dto';
import { ContactInfoDto } from './contact-info.dto';
import { TierDto } from './tier.dto';

export class CreatePartnerDto {
  //! name
  @IsDefined()
  @ValidateNested({
    message: 'name must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  name!: TranslationDto;

  //! year
  @IsDefined({ message: 'year isnt defined' })
  @Type(() => Number)
  @IsInt()
  @Min(2026)
  @Max(2060)
  year!: number;

  //! tier
  @IsDefined()
  @ValidateNested()
  @Type(() => TierDto)
  tier!: TierDto;

  //! image
  @IsDefined()
  @IsUrl()
  @IsNotEmpty()
  @IsExistingMedia()
  image!: string;

  //! Slug
  @IsDefined({ message: 'slug isnt defined' })
  @ValidateNested({
    message: 'slug must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  slug!: TranslationDto;

  //! long description
  @IsDefined()
  @ValidateNested({
    message: 'long description must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  long_description!: TranslationDto;

  //! short description
  @IsDefined()
  @ValidateNested({
    message: 'short description must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  short_description!: TranslationDto;

  //! contact info
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info?: ContactInfoDto;

  //! social links
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  social_links!: string[];

  //! services
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];
}
