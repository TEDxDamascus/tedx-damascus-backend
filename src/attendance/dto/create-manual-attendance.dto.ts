import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ManualAttendeeDto {
  @ApiProperty({ example: 'guest@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Guest Name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

export class CreateManualAttendanceDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  eventId: string;

  @ApiProperty({ type: [ManualAttendeeDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ManualAttendeeDto)
  attendees: ManualAttendeeDto[];
}
