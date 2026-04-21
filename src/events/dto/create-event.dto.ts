import {
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
  IsDate,
  IsDefined,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';
import { TranslationDto } from '../../common/dto/translation.dto';
import { IsExistingSpeaker } from 'src/common/decorators/is-existing-speaker.decorator';
import { IsExistingMedia } from 'src/common/decorators/is-existing-media.decorator';

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

  //! Event Type (salon,main_event,meetup)
  @IsDefined()
  @IsEnum(EventType, {
    message: `event_type must be one of: [${Object.values(EventType).join(', ')}]`,
  })
  @IsNotEmpty()
  event_type!: string;

  //! Event Image
  @IsDefined()
  @IsUrl() // url is the right pick if you see an conflict
  @IsNotEmpty()
  @IsExistingMedia()
  event_image!: string;

  //! Event Status
  @IsDefined()
  @IsEnum(EventStatus, {
    message: `status must be one of: [${Object.values(EventStatus).join(', ')}]`,
  })
  @IsNotEmpty()
  status!: string;

  //! Date
  @IsDefined()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date!: Date;

  //! Speakers
  @IsDefined()
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique({ message: 'Each speaker can only be added once' })
  @IsExistingSpeaker({ each: true })
  speakers!: string[];

  //! is_deleted
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_deleted?: boolean;

  //! Gallery
  @IsDefined()
  @IsUrl({}, { each: true })
  @ArrayNotEmpty()
  @IsExistingMedia({
    each: true,
    message: 'One or more gallery images do not exist in storage',
  })
  gallery!: string[];
}

// i think we should add a photo module ?
