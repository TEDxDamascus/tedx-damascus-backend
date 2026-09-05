import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateFromSubmissionsDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  eventId: string;

  @ApiProperty({
    type: [String],
    example: ['507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsMongoId({ each: true })
  submissionIds: string[];
}
