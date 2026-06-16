import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OffsetPaginationDto } from '../../common/pagination/dto/offset-pagination.dto';

export const WALL_HISTORY_ANSWER_STATUSES = ['pending', 'approved'] as const;

export type WallHistoryAnswerStatus =
  (typeof WALL_HISTORY_ANSWER_STATUSES)[number];

export class WallHistoryAnswerQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({
    enum: WALL_HISTORY_ANSWER_STATUSES,
    description:
      'Filter by answer status. Omit to return both pending and approved answers.',
  })
  @IsOptional()
  @IsEnum(WALL_HISTORY_ANSWER_STATUSES)
  status?: WallHistoryAnswerStatus;
}
