import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMediaBasenameDto {
  @ApiProperty({
    description:
      'New basename for the media (no file extension; format is kept from upload)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  basename: string;
}
