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
