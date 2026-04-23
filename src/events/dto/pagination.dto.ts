import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  offset: number;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit: number; // default value if not passed
}

// fix creating partners
// fix creating team
