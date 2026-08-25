import { ApiProperty } from '@nestjs/swagger';

export class FailedEmailDto {
  @ApiProperty({ example: 'failed@example.com' })
  email: string;

  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'SMTP authentication failed', required: false })
  reason?: string;
}

export class SentEmailDto {
  @ApiProperty({ example: 'recipient@example.com' })
  email: string;

  @ApiProperty({ example: true })
  success: boolean;
}

export class SendBulkEmailResultDto {
  @ApiProperty({ example: 'Bulk email processed' })
  message: string;

  @ApiProperty({ example: 2 })
  sent: number;

  @ApiProperty({ example: 1 })
  failed: number;

  @ApiProperty({ type: [SentEmailDto] })
  deliveries: SentEmailDto[];

  @ApiProperty({ type: [FailedEmailDto] })
  failures: FailedEmailDto[];
}
