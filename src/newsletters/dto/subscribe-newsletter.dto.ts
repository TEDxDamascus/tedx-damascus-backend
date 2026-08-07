import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SubscribeNewsletterDto {
  @ApiProperty({
    description: 'Email address to subscribe to the newsletter',
    example: 'subscriber@example.com',
  })
  @IsEmail()
  email: string;
}
