import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { SendBulkEmailResultDto } from '../emails/dto/send-bulk-email-result.dto';
import { UserPermission, UserRole } from '../users/entities/user.entity';
import { AttendanceService } from './attendance.service';
import {
  AttendanceResponseDto,
  CreateFromSubmissionsResultDto,
  RevokeAttendanceResultDto,
  ScanAttendanceResultDto,
} from './dto/attendance-response.dto';
import { CreateFromSubmissionsDto } from './dto/create-from-submissions.dto';
import { CreateManualAttendanceDto } from './dto/create-manual-attendance.dto';
import { InviteAttendanceDto } from './dto/invite-attendance.dto';
import { ListAttendanceQueryDto } from './dto/list-attendance-query.dto';
import { RevokeAttendanceDto } from './dto/revoke-attendance.dto';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth('bearer')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('from-submissions')
  @Permissions(UserPermission.ATTENDANCE_CREATE)
  @ApiOperation({ summary: 'Create attendance list from form submissions' })
  @ApiOkResponse({ type: CreateFromSubmissionsResultDto })
  createFromSubmissions(
    @Body() dto: CreateFromSubmissionsDto,
  ): Promise<CreateFromSubmissionsResultDto> {
    return this.attendanceService.createFromSubmissions(dto);
  }

  @Post('manual')
  @Permissions(UserPermission.ATTENDANCE_CREATE)
  @ApiOperation({ summary: 'Manually add an attendee' })
  @ApiOkResponse({ type: AttendanceResponseDto })
  createManual(
    @Body() dto: CreateManualAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.createManual(dto);
  }

  @Get()
  @Permissions(UserPermission.ATTENDANCE_READ)
  @ApiOperation({ summary: 'List attendance for an event' })
  findAll(@Query() query: ListAttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Post('invite')
  @Permissions(UserPermission.ATTENDANCE_INVITE)
  @ApiOperation({ summary: 'Send invitation emails with QR codes' })
  @ApiOkResponse({ type: SendBulkEmailResultDto })
  invite(@Body() dto: InviteAttendanceDto) {
    return this.attendanceService.invite(dto);
  }

  @Post('revoke')
  @Permissions(UserPermission.ATTENDANCE_REVOKE)
  @ApiOperation({ summary: 'Revoke invitations / accepted attendance' })
  @ApiOkResponse({ type: RevokeAttendanceResultDto })
  revoke(
    @Body() dto: RevokeAttendanceDto,
  ): Promise<RevokeAttendanceResultDto> {
    return this.attendanceService.revoke(dto);
  }

  @Post('gate/scan')
  @Permissions(UserPermission.ATTENDANCE_GATE_SCAN)
  @ApiOperation({ summary: 'Scan invitation QR and check in attendee' })
  @ApiOkResponse({ type: ScanAttendanceResultDto })
  scan(
    @Body() dto: ScanAttendanceDto,
    @Req() req: { user: { id: string } },
  ): Promise<ScanAttendanceResultDto> {
    return this.attendanceService.scan(dto, req.user.id);
  }

  @Get(':id')
  @Permissions(UserPermission.ATTENDANCE_READ)
  @ApiOperation({ summary: 'Get attendance by id' })
  @ApiOkResponse({ type: AttendanceResponseDto })
  findOne(
    @Param('id', ParseIdPipe) id: string,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.findOne(id);
  }
}
