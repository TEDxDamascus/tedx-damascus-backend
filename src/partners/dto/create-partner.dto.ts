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
  partnership_type!: string;

  //! description
  @IsDefined()
  @ValidateNested({
    message: 'description must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  description!: TranslationDto;

  //! social links
  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  social_links!: string[];
}
