import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TranslationDto } from 'src/common/dto/translation.dto';

export class CreateOrganizerDto {
  @IsDefined()
  @ValidateNested({ message: 'name must contain both en and ar translations' })
  @Type(() => TranslationDto)
  name!: TranslationDto;

  @IsDefined()
  image!: string;

  @IsDefined()
  @ValidateNested({ message: 'bio must contain both en and ar translations' })
  @Type(() => TranslationDto)
  bio!: TranslationDto;

  @IsDefined()
  social_links!: string[]; //TODO make it object

  @IsDefined()
  role!: string;

  @IsDefined()
  gallery!: string[];
}
