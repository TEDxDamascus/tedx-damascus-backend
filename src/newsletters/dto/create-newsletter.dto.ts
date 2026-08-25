import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNewsletterDto {
  @ApiProperty({ example: 'Weekly TEDx Damascus Update' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: '<h1>Latest updates</h1><p>...</p>' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30000)
  content: string;
}
