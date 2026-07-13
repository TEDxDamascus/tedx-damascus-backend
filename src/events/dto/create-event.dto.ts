import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsDefined,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';
import { TranslationDto } from '../../common/dto/translation.dto';
import { IsExistingSpeaker } from '../../common/decorators/is-existing-speaker.decorator';
import { IsExistingTeam } from '../../common/decorators/is-existing-team.decorator';
import { IsExistingMedia } from '../../common/decorators/is-existing-media.decorator';

export class CreateEventDto {
  //! Title
  @IsDefined()
  @ValidateNested({ message: 'title must contain both en and ar translations' })
  @Type(() => TranslationDto)
  title!: TranslationDto;

  //! Description
  @IsDefined()
  @ValidateNested({
    message: 'description must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  description!: TranslationDto;

  //! Brief
  @IsOptional()
  @ValidateNested({ message: 'brief must contain both en and ar translations' })
  @Type(() => TranslationDto)
  brief?: TranslationDto;

  //! Location
  @IsDefined()
  @ValidateNested({
    message: 'location must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  location!: TranslationDto;

  @IsDefined()
  @ValidateNested({
    message: 'location description  must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  location_description!: TranslationDto;

  //! Event Type (salon,main_event,meetup)
  @IsDefined()
  @IsEnum(EventType, {
    message: `event_type must be one of: [${Object.values(EventType).join(', ')}]`,
  })
  @IsNotEmpty()
  event_type!: string;

  //! Event Image
  @IsOptional()
  @IsUrl() // url is the right pick if you see an conflict
  @IsExistingMedia()
  event_image?: string;

  //! Event Status
  @IsDefined()
  @IsEnum(EventStatus, {
    message: `status must be one of: [${Object.values(EventStatus).join(', ')}]`,
  })
  @IsNotEmpty()
  status!: string;

  @IsDefined()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  coordinates!: [number, number];

  //! volunteer count

  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  volunteers_count?: number;

  @IsEmail()
  location_email!: string;

  @IsPhoneNumber()
  location_phone!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Matches(/^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/, {
    message: 'start_time must be in h:mm AM/PM format (e.g. 4:00 AM)',
  })
  start_time!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Matches(/^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/, {
    message: 'end_time must be in h:mm AM/PM format (e.g. 10:00 PM)',
  })
  end_time!: string;

  //! Date
  @IsDefined()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date!: Date;

  //! Speakers
  @IsDefined()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique({ message: 'Each speaker can only be added once' })
  @IsExistingSpeaker({ each: true })
  speakers!: string[];

  //! Team Members
  @IsDefined()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique({ message: 'Each team member can only be added once' })
  @IsExistingTeam({ each: true })
  team_members!: string[];

  //! is_deleted
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_deleted?: boolean;

  //! Gallery
  @IsOptional()
  @IsUrl({}, { each: true })
  @IsExistingMedia({
    each: true,
    message: 'One or more gallery images do not exist in storage',
  })
  gallery?: string[];
}
