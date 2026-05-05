import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { TranslationDto } from '../../common/dto/translation.dto';
import { IsExistingMedia } from '../../common/decorators/is-existing-media.decorator';

export class CreateSpeakerDto {
  @IsDefined()
  @ValidateNested({ message: 'name must contain both en and ar translations' })
  @Type(() => TranslationDto)
  name!: TranslationDto;

  @IsDefined()
  @ValidateNested({ message: 'bio must contain both en and ar translations' })
  @Type(() => TranslationDto)
  bio!: string;

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

  @IsDefined()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  social_links!: string[]; //$ until i make the Link Schema (hol up )

  @IsDefined()
  @IsUrl({}, { each: true })
  @ArrayNotEmpty()
  @IsExistingMedia({
    each: true,
    message: 'One or more gallery images do not exist in storage',
  })
  gallery!: string[];

  @IsDefined()
  @IsNotEmpty()
  @IsUrl()
  video_link!: string;
}
