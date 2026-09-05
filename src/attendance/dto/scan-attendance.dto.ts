import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ScanAttendanceDto {
  @ApiProperty({
    description: 'Opaque invitation token encoded in the QR code',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token: string;
}
