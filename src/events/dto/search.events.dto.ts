import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EventType } from '../enums/event-type.enum';
import { Type } from 'class-transformer';
import { EventStatus } from '../enums/event-status.enum';

export class EventQueryDto {
  //! searching with
  @IsOptional()
  @IsString()
  title?: string;

  //! filtering by Year
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2026)
  @Max(2060)
  year?: number;

  //! filtering by event-type
  @IsOptional()
  @IsString()
  @IsEnum(EventType, {
    message: `event_type must be one of: [${Object.values(EventType).join(', ')}]`,
  })
  type?: EventType;

  //! filtering by status
  @IsOptional()
  @IsString()
  @IsEnum(EventStatus, {
    message: `status must be one of: [${Object.values(EventStatus).join(', ')}]`,
  })
  status?: EventStatus;
}
