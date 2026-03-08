import {
  ArrayNotEmpty,
  IsBoolean,
  IsDate,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';
import { TranslationDto } from 'src/common/dto/translation.dto';

export class CreateEventDto {
  //! Title
  @IsDefined()
  @ValidateNested()
  @Type(() => TranslationDto)
  title: TranslationDto;

  //! Description
  @IsDefined()
  @ValidateNested()
  @Type(() => TranslationDto)
  description: TranslationDto;

  //! Brief
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  brief: TranslationDto;

  //! Location
  @IsDefined()
  @ValidateNested()
  @Type(() => TranslationDto)
  location: TranslationDto;

  //! Event Type (salon,main_event,meetup)
  @IsDefined()
  @IsEnum(EventType, {
    message: `event_type must be one of: [${Object.values(EventType).join(', ')}]`,
  })
  @IsNotEmpty()
  event_type: string;

  //! Event Image
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  event_image: string; //$ Should be an Image Type

  //! Event Status
  @IsDefined()
  @IsEnum(EventStatus, {
    message: `status must be one of: [${Object.values(EventStatus).join(', ')}]`,
  })
  @IsNotEmpty()
  status: string;

  //! Date
  @IsDefined()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date: Date;

  //! Speakers
  @IsDefined()
  @IsString({ each: true })
  @ArrayNotEmpty()
  speakers: string[]; //$ Should be the Type Speaker

  //! is_deleted
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_deleted: boolean;

  //! Gallery
  @IsDefined()
  // @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  gallery: string[]; //$ Should be Array of Image Type
}

// i think we should add a photo module ?
