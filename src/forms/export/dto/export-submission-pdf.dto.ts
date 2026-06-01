import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsMongoId,
} from 'class-validator';

export class ExportSubmissionPdfDto {
  @ApiProperty({
    description: 'Submission ID to export (must belong to the form and be submitted)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  submissionId: string;

  @ApiProperty({
    description:
      'Question IDs to include in the export. Section headers appear only if the section ID is listed.',
    type: [String],
    minItems: 1,
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  questionIds: string[];

  @ApiProperty({
    description: 'Locale for question labels and formatted answers',
    enum: ['en', 'ar'],
    example: 'en',
  })
  @IsIn(['en', 'ar'])
  locale: 'en' | 'ar';
}
