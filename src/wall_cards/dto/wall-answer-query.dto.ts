import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { OffsetPaginationDto } from '../../common/pagination/dto/offset-pagination.dto';
import { WALL_ANSWER_STATUSES } from '../entities/wall-answer.entity';

export class WallAnswerQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ enum: WALL_ANSWER_STATUSES })
  @IsOptional()
  @IsEnum(WALL_ANSWER_STATUSES)
  status?: (typeof WALL_ANSWER_STATUSES)[number];

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'When true, return only answers selected as featured for this question.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;
}
