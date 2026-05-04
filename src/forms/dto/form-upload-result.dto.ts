import { ApiProperty } from '@nestjs/swagger';

export class FormUploadResultDto {
  @ApiProperty({
    description:
      'Public URL of the uploaded file. Use this string as the answer value for file_upload questions.',
    example: 'https://cdn.example.com/users/507f1f77bcf86cd799439011/forms/507f1f77bcf86cd799439012/a1b2c3d4-document.pdf',
  })
  url: string;
}
