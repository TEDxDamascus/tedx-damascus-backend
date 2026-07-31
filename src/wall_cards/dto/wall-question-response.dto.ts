import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WallAnswerResponseDto } from './wall-answer-response.dto';
import { WallQuestionTextDto } from './wall-question-text.dto';

export class WallQuestionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: WallQuestionTextDto })
  text: WallQuestionTextDto;

  @ApiProperty()
  expiresAt: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  publishedAt: string;

  @ApiPropertyOptional()
  publishedBy?: string;

  @ApiPropertyOptional()
  archivedAt?: string;

  @ApiPropertyOptional()
  replacedByQuestionId?: string;

  @ApiPropertyOptional({ type: [String] })
  featuredAnswerIds?: string[];
}

export class WallCurrentResponseDto {
  @ApiProperty({ type: WallQuestionResponseDto })
  question: WallQuestionResponseDto;

  @ApiProperty({ type: [WallAnswerResponseDto] })
  answers: WallAnswerResponseDto[];
}

export class WallHistoryAnswersResponseDto {
  @ApiProperty({ type: WallQuestionResponseDto })
  question: WallQuestionResponseDto;

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
