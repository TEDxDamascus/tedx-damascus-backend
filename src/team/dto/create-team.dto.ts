import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsExistingMedia } from 'src/common/decorators/is-existing-media.decorator';
import { TranslationDto } from 'src/common/dto/translation.dto';

export class CreateTeamDto {
  @IsDefined()
  @ValidateNested({ message: 'name must contain both en and ar translations' })
  @Type(() => TranslationDto)
  name!: TranslationDto;
  @IsDefined()
  @IsUrl()
  @IsNotEmpty()
  @IsExistingMedia()
  image!: string;
  //! what year he contributed
  @IsDefined({ message: 'year isnt defined' })
  @Type(() => Number)
  @IsInt()
  @Min(2026)
  @Max(2060)
  year!: number;
  @IsDefined()
  @ArrayNotEmpty()
  social_link!: string[]; //TODO make it object
  @IsDefined()
  @ValidateNested({ message: 'bio must contain both en and ar translations' })
  @Type(() => TranslationDto)
  bio!: TranslationDto;
}
