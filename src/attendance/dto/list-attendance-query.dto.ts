import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { OffsetPaginationDto } from '../../common/pagination/dto/offset-pagination.dto';
import { AttendanceStatusEnum } from '../enums/attendance-status.enum';

export class ListAttendanceQueryDto extends OffsetPaginationDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  eventId: string;

  @ApiPropertyOptional({ enum: AttendanceStatusEnum })
  @IsOptional()
  @IsEnum(AttendanceStatusEnum)
  status?: AttendanceStatusEnum;
}
