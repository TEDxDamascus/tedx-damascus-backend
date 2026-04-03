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
}
