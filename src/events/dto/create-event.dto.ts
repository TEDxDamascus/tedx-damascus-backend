import {
  ArrayNotEmpty,
  IsBoolean,
  IsDate,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';

export class CreateEventDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDefined()
  @IsEnum(EventType, {
    message: `event_type must be one of: [${Object.values(EventType).join(', ')}]`,
  })
  @IsNotEmpty()
  event_type: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  event_image: string; //! Should be an Image Type

  @IsDefined()
  @IsEnum(EventStatus, {
    message: `status must be one of: [${Object.values(EventStatus).join(', ')}]`,
  })
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brief: string;

  @IsDefined()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsDefined()
  @IsString({ each: true })
  @ArrayNotEmpty()
  speakers: string[]; //! Should be the Type Speaker

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_deleted: boolean;

  @IsDefined()
  // @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  gallery: string[]; //! Should be Array of Image Type
}

// i think we should add a photo module ?
