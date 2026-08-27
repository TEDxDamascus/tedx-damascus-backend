import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class GenerateQrCodeDto {
  @ApiProperty({
    description: 'Absolute page URL to encode in the QR code.',
    example: 'https://tedxdamascus.com/blogs/a-new-tedx-damascus-story',
  })
  @IsUrl({ require_protocol: true, require_tld: false })
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({
    description: 'Rendered SVG size in pixels.',
    example: 512,
    default: 512,
    minimum: 128,
    maximum: 2000,
  })
  @IsOptional()
  @IsInt()
  @Min(128)
  @Max(2000)
  size?: number;

  @ApiPropertyOptional({
    description: 'Quiet-zone margin around the QR modules, measured in modules.',
    example: 4,
    default: 4,
    minimum: 0,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  margin?: number;
}
