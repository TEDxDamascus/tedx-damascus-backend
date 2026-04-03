import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { string } from 'joi';
import { TranslationDto } from '../../common/dto/translation.dto';
import { IsExistingMedia } from '../../common/decorators/is-existing-media.decorator';

export class CreateSpeakerDto {
  @IsDefined()
  @ValidateNested({ message: 'name must contain both en and ar translations' })
  @Type(() => TranslationDto)
  name: TranslationDto;

  @IsDefined()
  @ValidateNested({ message: 'bio must contain both en and ar translations' })
  @Type(() => TranslationDto)
  bio: string;

  @IsDefined()
  @ValidateNested({
    message: 'description must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  description: string;

  @IsDefined()
  @IsMongoId()
  @IsNotEmpty()
  @IsExistingMedia()
  speaker_image: string;

  @IsDefined()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  social_links: string[]; //$ until i make the Link Schema (hol up )

  @IsDefined()
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  @IsExistingMedia({ each: true })
  gallery: string[];

  @IsDefined()
  @IsNotEmpty()
  @IsUrl()
  video_link: string;
}
