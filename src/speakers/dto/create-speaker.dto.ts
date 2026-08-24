import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { TranslationDto } from '../../common/dto/translation.dto';
import { IsExistingMedia } from '../../common/decorators/is-existing-media.decorator';
import { ContactInfoDto } from 'src/partners/dto/contact-info.dto';

export class CreateSpeakerDto {
  @IsDefined()
  @ValidateNested({ message: 'name must contain both en and ar translations' })
  @Type(() => TranslationDto)
  name!: TranslationDto;

  @IsDefined()
  @ValidateNested({ message: 'bio must contain both en and ar translations' })
  @Type(() => TranslationDto)
  bio!: string;

  @IsOptional()
  @ValidateNested({ message: 'slug must contain both en and ar translations' })
  @Type(() => TranslationDto)
  slug!: string;

  @IsDefined()
  @ValidateNested({ message: 'brief must contain both en and ar translations' })
  @Type(() => TranslationDto)
  brief!: string;

  @IsDefined()
  @ValidateNested({
    message: 'experience must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  experience!: string;

  @IsDefined()
  @ValidateNested({
    message: 'description must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  description!: string;

  @IsDefined()
  @IsUrl()
  @IsNotEmpty()
  @IsExistingMedia()
  speaker_image!: string;

  // @IsOptional()
  // @IsEmail()
  // @IsNotEmpty()
  // speaker_email!: string;

  //! contact info
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info!: ContactInfoDto;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  social_links!: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  @IsExistingMedia({
    each: true,
    message: 'One or more gallery images do not exist in storage',
  })
  gallery!: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  video_link!: string[];
}
