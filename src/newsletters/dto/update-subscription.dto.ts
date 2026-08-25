import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive: boolean;
}
