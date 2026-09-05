import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatusEnum } from '../enums/attendance-status.enum';

export class AttendanceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiPropertyOptional()
  formTemplateId?: string;

  @ApiPropertyOptional()
  submissionId?: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiProperty({ enum: AttendanceStatusEnum })
  status: AttendanceStatusEnum;

  @ApiPropertyOptional()
  invitationSentAt?: Date;

  @ApiPropertyOptional()
  attendedAt?: Date;

  @ApiPropertyOptional()
  checkedInBy?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}


export class CreateFromSubmissionsFailureDto {
  @ApiProperty()
  submissionId: string;

  @ApiProperty()
  reason: string;
}

export class CreateFromSubmissionsResultDto {
  @ApiProperty({ type: [AttendanceResponseDto] })
  created: AttendanceResponseDto[];

  @ApiProperty({ type: [CreateFromSubmissionsFailureDto] })
  failures: CreateFromSubmissionsFailureDto[];
}

export class ScanAttendanceResultDto {
  @ApiProperty()
  valid: boolean;

  @ApiPropertyOptional({
    enum: ['already_attended', 'revoked', 'invalid'],
  })
  reason?: 'already_attended' | 'revoked' | 'invalid';

  @ApiPropertyOptional({ type: AttendanceResponseDto })
  attendance?: AttendanceResponseDto;

  @ApiPropertyOptional()
  attendedAt?: Date;
}

export class RevokeAttendanceResultDto {
  @ApiProperty()
  revoked: number;

  @ApiProperty({ type: [String] })
  attendanceIds: string[];
}
