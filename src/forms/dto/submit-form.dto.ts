import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Answers keyed by question ID (string).
 *
 * Supported answer shapes per question type:
 * - short_text, long_text: string
 * - single_choice: string (option ID)
 * - checkbox_group: string[] (option IDs)
 * - date: string (ISO date)
 * - phone_number: string (either +963 followed by 9 digits, or 10-digit local)
 * - url: string (valid URL)
 * - rating: number (integer between config.min and config.max)
 * - date_range: { start: string; end: string } (ISO dates)
 * - file_upload: { mediaId: string; url: string } (from /storage/upload)
 */
export class SubmitFormDto {
  @ApiProperty({
    description:
      'Map of question ID to answer value. Shape of each value depends on the question type.',
    example: {
      '507f1f77bcf86cd799439011': 'Short text answer',
      '507f1f77bcf86cd799439012': ['507f1f77bcf86cd799439013'],
      phoneQuestionId: '+9639XXXXXXXX',
      urlQuestionId: 'https://example.com',
      ratingQuestionId: 4,
      dateRangeQuestionId: {
        start: '2025-01-01',
        end: '2025-01-31',
      },
      fileUploadQuestionId: {
        mediaId: '64f1c5f1e1b2c3d4e5f67890',
        url: 'https://cdn.example.com/path/to/file.pdf',
      },
    },
  })
  @IsObject()
  answers: Record<string, unknown>;
}
