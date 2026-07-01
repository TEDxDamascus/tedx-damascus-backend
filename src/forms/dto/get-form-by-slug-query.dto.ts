import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetFormBySlugQueryDto {
  @ApiProperty({
    description: 'Form slug (matches slug.en or slug.ar)',
    example: 'speaker-2025',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  slug: string;
}
