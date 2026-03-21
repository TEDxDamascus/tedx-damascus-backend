import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QUESTION_TYPES } from '../entities/form-question.schema';

export class LocalizedTextDto {
  @ApiProperty({ example: 'Name', description: 'English text' })
  en: string;

  @ApiProperty({ example: 'الاسم', description: 'Arabic text' })
  ar: string;
}

export class QuestionOptionResponseDto {
  @ApiProperty({ description: 'Option ID as string' })
  id: string;

  @ApiProperty({ description: 'Order index within the options list' })
  orderIndex: number;

  @ApiProperty({ type: LocalizedTextDto })
  label: LocalizedTextDto;
}

export class FormQuestionResponseDto {
  @ApiProperty({ description: 'Question ID as string' })
  id: string;

  @ApiProperty({ description: 'Order index within the form' })
  orderIndex: number;

  @ApiProperty({
    enum: QUESTION_TYPES,
    enumName: 'QuestionTypesEnum',
    description:
      'Question type. Supported values: short_text, long_text, single_choice, checkbox_group, date, phone_number, url, rating, date_range, file_upload.',
    example: 'short_text',
  })
  type: string;

  @ApiProperty({ type: LocalizedTextDto })
  title: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  helpText?: LocalizedTextDto;

  @ApiProperty({ description: 'Whether this question is required to submit' })
  isRequired: boolean;

  @ApiProperty({
    description:
      'Type-specific configuration. Examples: rating { min: 1, max: 5 }, date { min_date, max_date }, date_range { min_date, max_date }, checkbox_group { min_selected, max_selected }.',
    example: {
      min: 1,
      max: 5,
    },
  })
  config: Record<string, unknown>;

  @ApiProperty({ type: [QuestionOptionResponseDto] })
  options: QuestionOptionResponseDto[];
}

export class FormTemplateSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: LocalizedTextDto })
  name: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  description?: LocalizedTextDto;

  @ApiProperty({
    description: 'Target role that should see this form',
    example: 'Speaker',
  })
  targetRole: string;

  @ApiProperty({ example: 'Draft' })
  status: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishedAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  starts_at?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  ends_at?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  expires_at?: Date;

  @ApiPropertyOptional({ description: 'Max total submissions; omit for unlimited' })
  max_submissions?: number;

  @ApiPropertyOptional({
    type: LocalizedTextDto,
    description: 'Human-readable URL slugs. Unique per locale.',
  })
  slug?: LocalizedTextDto;

  @ApiPropertyOptional({
    type: LocalizedTextDto,
    description: 'Full shareable URLs for copying and sharing.',
  })
  shareable_url?: LocalizedTextDto;
}

export class FormTemplateSchemaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: LocalizedTextDto })
  name: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  description?: LocalizedTextDto;

  @ApiProperty({
    description: 'Target role that should see this form',
    example: 'Attender',
  })
  targetRole: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  starts_at?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  ends_at?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  expires_at?: Date;

  @ApiPropertyOptional({ description: 'Max total submissions; omit for unlimited' })
  max_submissions?: number;

  @ApiProperty({ type: [FormQuestionResponseDto] })
  questions: FormQuestionResponseDto[];
}

export class FormSubmissionAnswerResponseDto {
  @ApiProperty({ description: 'Question ID this answer belongs to' })
  questionId: string;

  @ApiProperty({
    description:
      'Answer value. Shape depends on question type: string, string[], boolean, number, { start, end } for date_range, { mediaId, url } for file_upload.',
    examples: {
      short_text: 'Short text answer',
      checkbox_group: ['optionId1', 'optionId2'],
      rating: 4,
      date_range: { start: '2025-01-01', end: '2025-01-31' },
      file_upload: {
        mediaId: '64f1c5f1e1b2c3d4e5f67890',
        url: 'https://cdn.example.com/path/to/file.pdf',
      },
    },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export class FormSubmissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  formTemplateId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ example: 'submitted', enum: ['draft', 'submitted'] })
  status: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Set only when status is submitted.',
  })
  submittedAt?: Date;

  @ApiProperty({ type: [FormSubmissionAnswerResponseDto] })
  answers: FormSubmissionAnswerResponseDto[];
}

export class MySubmissionResponseDto {
  @ApiProperty({ type: FormTemplateSchemaResponseDto })
  schema: FormTemplateSchemaResponseDto;

  @ApiProperty({
    description: 'Answers keyed by question ID',
    type: 'object',
    additionalProperties: true,
  })
  answers: Record<string, unknown>;

  @ApiProperty({ enum: ['draft', 'submitted'] })
  status: string;
}

