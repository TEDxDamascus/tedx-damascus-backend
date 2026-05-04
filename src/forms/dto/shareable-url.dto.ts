import { IsOptional, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ShareableUrlI18nDto {
  @ApiPropertyOptional({
    description: 'Full absolute URL for English shareable link.',
    example: 'https://tedxdamascus.com/apply/speaker-2025',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsUrl()
  @MaxLength(500)
  en?: string;

  @ApiPropertyOptional({
    description: 'Full absolute URL for Arabic shareable link.',
    example: 'https://tedxdamascus.com/ar/apply/speaker-2025',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsUrl()
  @MaxLength(500)
  ar?: string;
}
