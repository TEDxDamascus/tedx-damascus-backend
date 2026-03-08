import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Answers keyed by question ID (string).
 * Values can be: string, string[] (option IDs), Date (ISO string), boolean.
 */
export class SubmitFormDto {
  @ApiProperty({
    description: 'Answers keyed by question ID',
    example: {
      '507f1f77bcf86cd799439011': 'Short text answer',
      '507f1f77bcf86cd799439012': ['507f1f77bcf86cd799439013'],
    },
  })
  @IsObject()
  answers: Record<string, string | string[] | boolean>;
}
