import { ApiProperty } from '@nestjs/swagger';
import { Media } from '../entities/media.entity';
import { getDisplayName } from '../utils/filename.util';

export class MediaDto {
  @ApiProperty({ description: 'Media document identifier' })
  id: string;

  @ApiProperty({
    description: 'Basename only (no extension); use "name" for full display filename',
  })
  basename: string;

  @ApiProperty({
    description: 'Display filename: basename + extension derived from format',
  })
  name: string;

  @ApiProperty({ description: 'Public URL of the media' })
  url: string;

  @ApiProperty({
    description: 'Creation timestamp of the media document',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type / format of the media' })
  format: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 123456,
  })
  size: number;

  static fromEntity(media: Media & { id?: string; _id?: unknown }): MediaDto {
    const dto = new MediaDto();
    dto.id =
      (media as any).id ??
      (typeof (media as any)._id === 'string'
        ? ((media as any)._id as string)
        : (media as any)._id?.toString());
    dto.basename = media.basename;
    dto.name = getDisplayName(media.basename, media.format);
    dto.url = media.url;
    dto.createdAt = media.createdAt;
    dto.format = media.format;
    dto.size = media.size;
    return dto;
  }
}

