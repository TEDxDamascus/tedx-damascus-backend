import { ApiProperty } from '@nestjs/swagger';

/**
 * Result of an image upload to Supabase storage.
 * Use this shape when persisting image metadata (e.g. in blogs, events, speakers).
 */
export class UploadImageResultDto {
  @ApiProperty({ description: 'Public URL of the uploaded image' })
  url: string;

  @ApiProperty({ description: 'Original filename from the client' })
  originalName: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  mimetype: string;

  @ApiProperty({
    description: 'File size in megabytes (MB)',
    example: 1.23,
  })
  sizeInMb: number;
}
