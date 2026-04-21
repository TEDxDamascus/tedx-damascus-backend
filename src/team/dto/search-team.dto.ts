import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TeamQueryDto {
  //! searching with
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
  //! searching with
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2026)
  @Max(2060)
  year?: number;
}

