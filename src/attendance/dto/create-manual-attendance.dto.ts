import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateManualAttendanceDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  eventId: string;

  @ApiProperty({ example: 'guest@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Guest Name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
