import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsDefined,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TranslationDto } from 'src/common/dto/translation.dto';

export class CreateTeamDto {
  @IsDefined()
  @ValidateNested({ message: 'name must contain both en and ar translations' })
  @Type(() => TranslationDto)
  name!: TranslationDto;
  @IsDefined()
  @IsString()
  image!: string;
  @IsDefined()
  @ArrayNotEmpty()
  social_link!: string[]; //TODO make it object
  @IsDefined()
  @ValidateNested({ message: 'bio must contain both en and ar translations' })
  @Type(() => TranslationDto)
  bio!: TranslationDto;
}
