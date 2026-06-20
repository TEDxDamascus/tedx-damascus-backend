import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WallAnswerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  questionId: string;

  @ApiProperty()
  text: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  submittedAt: string;

  @ApiPropertyOptional()
  approvedAt?: string;

  @ApiPropertyOptional()
  approvedBy?: string;
}

export class WallQuestionAnswersResponseDto {
  @ApiProperty({ type: [WallAnswerResponseDto] })
  featuredAnswers: WallAnswerResponseDto[];

  @ApiProperty({ type: [WallAnswerResponseDto] })
  items: WallAnswerResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}
