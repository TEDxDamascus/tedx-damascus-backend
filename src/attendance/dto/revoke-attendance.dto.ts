import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class RevokeAttendanceDto {
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
}
