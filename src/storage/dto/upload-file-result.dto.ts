import { ApiProperty } from '@nestjs/swagger';

/**
 * Result of a file upload to object storage.
 * Mirrors the Media schema (basename + format) with derived name and sizeInMb.
 */
export class UploadFileResultDto {
  @ApiProperty({ description: 'Media document identifier' })
  id: string;

  @ApiProperty({ description: 'Basename only (no extension)' })
  basename: string;

  @ApiProperty({ description: 'Display filename: basename + extension from format' })
  name: string;

  @ApiProperty({ description: 'Public URL of the uploaded file' })
  url: string;

  @ApiProperty({
    description: 'Creation timestamp of the media document',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type of the file' })
  format: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 123456,
  })
  size: number;

  @ApiProperty({
    description: 'File size in megabytes (MB), derived from size',
    example: 1.23,
  })
  sizeInMb: number;
}
