import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsExistingMedia } from 'src/common/decorators/is-existing-media.decorator';
import { IsExistingEvent } from 'src/common/decorators/is-existing-event.decorator';
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
  //! role
  @IsOptional()
  @ValidateNested({ message: 'role must contain both en and ar translations' })
  @Type(() => TranslationDto)
  role!: TranslationDto;
  //! events
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  @IsExistingEvent({ each: true })
  @ArrayUnique({ message: 'events must not contain duplicate ids' })
  events!: string[];
  //! category
  @IsOptional()
  @ValidateNested({
    message: 'category must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  category!: TranslationDto;
  //! social links
  @IsDefined()
  @ArrayNotEmpty()
  social_links!: string[];
  //! BIo
  @IsDefined()
  @ValidateNested({ message: 'bio must contain both en and ar translations' })
  @Type(() => TranslationDto)
  bio!: TranslationDto;
}
