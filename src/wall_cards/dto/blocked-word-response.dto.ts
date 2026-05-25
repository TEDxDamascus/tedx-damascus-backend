import { ApiProperty } from '@nestjs/swagger';

export class BlockedWordResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  word: string;

  @ApiProperty()
  createdAt: string;
}
