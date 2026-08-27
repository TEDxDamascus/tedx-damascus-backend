import { ApiProperty } from '@nestjs/swagger';

export class QrCodeResponseDto {
  @ApiProperty({ example: 'https://tedxdamascus.com/blogs/example' })
  url: string;

  @ApiProperty({ example: 'image/svg+xml' })
  mimeType: string;

  @ApiProperty({ example: 512 })
  size: number;

  @ApiProperty({ example: 97 })
  modules: number;

  @ApiProperty({
    description: 'Complete SVG markup for rendering or downloading the QR code.',
  })
  svg: string;

  @ApiProperty({
    description: 'SVG encoded as a data URL, ready to use as an img src.',
  })
  dataUrl: string;
}
