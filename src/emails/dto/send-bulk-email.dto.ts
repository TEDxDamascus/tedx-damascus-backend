import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class SendBulkEmailDto {
  @ApiProperty({
    description: 'Recipient email list',
    example: ['first@example.com', 'second@example.com'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsEmail({}, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : value;
      } catch {
        return value;
      }
    }

    return trimmed
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
  })
  emails: string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'TEDx Damascus update',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    description:
      'HTML email body rendered inside the email template.',
    example: '<h2>Hello</h2><p>This is a <strong>formatted</strong> update.</p>',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30000)
  htmlMessage: string;

  @ApiProperty({
    description:
      'Optional public HTTPS image URL rendered above the email message.',
    example: 'https://example.com/tedx-banner.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2000)
  imageUrl?: string;

}
