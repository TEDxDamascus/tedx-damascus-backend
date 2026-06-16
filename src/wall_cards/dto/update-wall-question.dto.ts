import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { TranslationDto } from '../../common/dto/translation.dto';
import { WALL_QUESTION_STATUSES } from '../entities/wall-question.entity';
import type { WallQuestionStatus } from '../entities/wall-question.entity';

class UpdateWallQuestionTextDto extends PartialType(TranslationDto) {}

export class UpdateWallQuestionDto {
  @ApiPropertyOptional({ type: UpdateWallQuestionTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWallQuestionTextDto)
  text?: UpdateWallQuestionTextDto;

  @ApiPropertyOptional({ enum: WALL_QUESTION_STATUSES })
  @IsOptional()
  @IsEnum(WALL_QUESTION_STATUSES)
  status?: WallQuestionStatus;
}
