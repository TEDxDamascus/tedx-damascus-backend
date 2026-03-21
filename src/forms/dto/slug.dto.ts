import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** URL-safe slug pattern: lowercase letters, numbers, hyphens. Empty string allowed. */
const SLUG_PATTERN = /^(|[a-z0-9]+(?:-[a-z0-9]+)*)$/;

export class SlugI18nDto {
  @ApiPropertyOptional({
    description: 'English URL slug. Must be unique. Pattern: lowercase letters, numbers, hyphens.',
    example: 'speaker-2025',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(SLUG_PATTERN, {
    message: 'slug.en must be URL-safe: lowercase letters, numbers, and hyphens only',
  })
  en?: string;

  @ApiPropertyOptional({
    description: 'Arabic URL slug. Must be unique. Non-ASCII chars are percent-encoded in URLs.',
    example: 'speaker-2025',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ar?: string;
}
