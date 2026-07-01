import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { OffsetPaginationDto } from '../../common/pagination/dto/offset-pagination.dto';
import { WALL_QUESTION_STATUSES } from '../entities/wall-question.entity';

export class WallQuestionQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ enum: WALL_QUESTION_STATUSES })
  @IsOptional()
  @IsEnum(WALL_QUESTION_STATUSES)
  status?: (typeof WALL_QUESTION_STATUSES)[number];
}
