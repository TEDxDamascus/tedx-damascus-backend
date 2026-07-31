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
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { IsExistingMedia } from 'src/common/decorators/is-existing-media.decorator';
import { TranslationDto } from 'src/common/dto/translation.dto';
import { ServiceDto } from './service.dto';
import { ContactInfoDto } from './contact-info.dto';
import { CardSizeEnum } from '../schema/partner.card.size.enum';

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

  @IsDefined({ message: 'partner_ship_type isnt defined' })
  @IsString()
  @MinLength(4, { message: 'partner_ship_type must be at least 4 characters' })
  @MaxLength(25, { message: 'partner_ship_type must not exceed 25 characters' })
  partner_ship_type!: string;

  @IsOptional()
  @IsEnum(CardSizeEnum, {
    message: `custom_card_size be one of: [${Object.values(CardSizeEnum).join(', ')}]`,
  })
  custom_card_size!: string;

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
  @IsDefined()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info!: ContactInfoDto;

  //! social links
  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  social_links!: string[];

  //! services
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => ServiceDto)
  services!: ServiceDto[];
}
