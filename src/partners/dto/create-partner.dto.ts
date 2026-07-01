import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { IsExistingMedia } from 'src/common/decorators/is-existing-media.decorator';
import { TranslationDto } from 'src/common/dto/translation.dto';
import { ServiceDto } from './service.dto';

export class ContactInfoDto {
  @IsDefined()
  @ValidateNested({
    message: 'address must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  address!: TranslationDto;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  email!: string;
}

export class CreatePartnerDto {
  //! name
  @IsDefined()
  @ValidateNested({
    message: 'name must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  name!: TranslationDto;

  //! image
  @IsDefined()
  @IsUrl()
  @IsNotEmpty()
  @IsExistingMedia()
  image!: string;

  //! Slug
  @IsDefined()
  @ValidateNested({
    message: 'slug must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  slug!: TranslationDto;

  //! partnership Type
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  partnership_type!: string;

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
