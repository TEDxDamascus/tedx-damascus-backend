import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class InviteAttendanceDto {
  @ApiProperty({
    type: [String],
    example: ['507f1f77bcf86cd799439011'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsMongoId({ each: true })
  attendanceIds: string[];

  @ApiProperty({ example: 'You are invited to TEDx Damascus' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    example: '<p>We are happy to invite you.</p>',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30000)
  htmlMessage: string;

  @ApiPropertyOptional({
    example: 'https://example.com/banner.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2000)
  imageUrl?: string;
}
