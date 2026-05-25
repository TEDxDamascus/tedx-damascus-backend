import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBlockedWordDto {
  @ApiProperty({ example: 'spam' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  word: string;
}
