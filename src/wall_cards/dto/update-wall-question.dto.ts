import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { WALL_QUESTION_STATUSES } from '../entities/wall-question.entity';
import type { WallQuestionStatus } from '../entities/wall-question.entity';
import { WallQuestionTextDto } from './wall-question-text.dto';

export class UpdateWallQuestionDto {
  @ApiPropertyOptional({ type: WallQuestionTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WallQuestionTextDto)
  text?: WallQuestionTextDto;

  @ApiPropertyOptional({ enum: WALL_QUESTION_STATUSES })
  @IsOptional()
  @IsEnum(WALL_QUESTION_STATUSES)
  status?: WallQuestionStatus;
}
