import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { IsExistingMedia } from 'src/common/decorators/is-existing-media.decorator';
import { TranslationDto } from 'src/common/dto/translation.dto';

export class CreateOrganizerDto {
  @IsDefined()
  @ValidateNested({ message: 'name must contain both en and ar translations' })
  @Type(() => TranslationDto)
  name!: TranslationDto;

  @IsDefined()
  @IsUrl()
  @IsNotEmpty()
  @IsExistingMedia()
  image!: string;

  @IsDefined()
  @ValidateNested({ message: 'bio must contain both en and ar translations' })
  @Type(() => TranslationDto)
  bio!: TranslationDto;

  @IsDefined()
  social_links!: string[];

  @IsDefined()
  @IsNotEmpty()
  @IsString() 
  role!: string;

  @IsDefined()
  @IsUrl({}, { each: true })
  @ArrayNotEmpty()
  @IsExistingMedia({
    each: true,
    message: 'One or more gallery images do not exist in storage',
  })
  gallery!: string[];
}
