import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import * as QRCode from 'qrcode';
import { buildPaginatedResult } from '../common/pagination/utils/pagination.util';
import { EmailsService } from '../emails/emails.service';
import {
  FailedEmailDto,
  SentEmailDto,
} from '../emails/dto/send-bulk-email-result.dto';
import { EventsService } from '../events/events.service';
import {
  FormSubmission,
  FormSubmissionDocument,
} from '../forms/entities/form-submission.schema';
import {
  FormTemplate,
  FormTemplateDocument,
} from '../forms/entities/form-template.schema';
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
import { AttendanceStatusEnum } from './enums/attendance-status.enum';
import {
  Attendance,
  AttendanceDocument,
} from './schema/attendance.schema';
import { extractSubmissionIdentity } from './utils/extract-submission-email.util';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(FormSubmission.name)
    private readonly formSubmissionModel: Model<FormSubmissionDocument>,
    @InjectModel(FormTemplate.name)
    private readonly formTemplateModel: Model<FormTemplateDocument>,
    private readonly eventsService: EventsService,
    private readonly emailsService: EmailsService,
  ) {}

  async createFromSubmissions(
    dto: CreateFromSubmissionsDto,
  ): Promise<CreateFromSubmissionsResultDto> {
    await this.assertEventExists(dto.eventId);

    const eventObjectId = new Types.ObjectId(dto.eventId);
    const submissionObjectIds = dto.submissionIds.map(
      (id) => new Types.ObjectId(id),
    );

    const submissions = await this.formSubmissionModel
      .find({ _id: { $in: submissionObjectIds } })
      .exec();
    const submissionById = new Map(
      submissions.map((s) => [s._id.toString(), s]),
    );

    const templateIds = [
      ...new Set(submissions.map((s) => s.formTemplateId.toString())),
    ];
    const templates = await this.formTemplateModel
      .find({ _id: { $in: templateIds.map((id) => new Types.ObjectId(id)) } })
      .exec();
    const templateById = new Map(
      templates.map((t) => [t._id.toString(), t]),
    );

    const created: AttendanceResponseDto[] = [];
    const failures: CreateFromSubmissionsResultDto['failures'] = [];

    for (const submissionId of dto.submissionIds) {
      const submission = submissionById.get(submissionId);
      if (!submission) {
        failures.push({ submissionId, reason: 'submission_not_found' });
        continue;
      }

      if (submission.status && submission.status !== 'submitted') {
        failures.push({ submissionId, reason: 'submission_not_submitted' });
        continue;
      }

      const template = templateById.get(submission.formTemplateId.toString());
      if (!template) {
        failures.push({ submissionId, reason: 'form_template_not_found' });
        continue;
      }

      const identity = extractSubmissionIdentity(
        template.questions ?? [],
        submission.answers ?? [],
      );
      if (!identity) {
        failures.push({ submissionId, reason: 'email_missing' });
        continue;
      }

      try {
        const doc = await this.attendanceModel.create({
          eventId: eventObjectId,
          formTemplateId: submission.formTemplateId,
          submissionId: submission._id,
          email: identity.email,
          ...(identity.name ? { name: identity.name } : {}),
          status: AttendanceStatusEnum.ACCEPTED,
        });
        created.push(this.toResponse(doc));
      } catch (error) {
        if (this.isDuplicateKeyError(error)) {
          failures.push({ submissionId, reason: 'duplicate' });
          continue;
        }
        throw error;
      }
    }

    return { created, failures };
  }

  async createManual(
    dto: CreateManualAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    await this.assertEventExists(dto.eventId);

    try {
      const doc = await this.attendanceModel.create({
        eventId: new Types.ObjectId(dto.eventId),
        email: dto.email.trim().toLowerCase(),
        ...(dto.name?.trim() ? { name: dto.name.trim() } : {}),
        status: AttendanceStatusEnum.ACCEPTED,
      });
      return this.toResponse(doc);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Attendance already exists for this email on this event',
        );
      }
      throw error;
    }
  }

  async findAll(query: ListAttendanceQueryDto) {
    const filter: Record<string, unknown> = {
      eventId: new Types.ObjectId(query.eventId),
    };
    if (query.status) {
      filter.status = query.status;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = query.skip;

    const [items, total] = await Promise.all([
      this.attendanceModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.attendanceModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<AttendanceResponseDto> {
    const doc = await this.attendanceModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Attendance with id ${id} was not found`);
    }
    return this.toResponse(doc);
  }

  async invite(dto: InviteAttendanceDto) {
    const objectIds = dto.attendanceIds.map((id) => new Types.ObjectId(id));
    const records = await this.attendanceModel
      .find({ _id: { $in: objectIds } })
      .exec();
    const byId = new Map(records.map((r) => [r._id.toString(), r]));

    const deliveries: SentEmailDto[] = [];
    const failures: FailedEmailDto[] = [];

    for (const attendanceId of dto.attendanceIds) {
      const record = byId.get(attendanceId);
      if (!record) {
        failures.push({ email: attendanceId, success: false });
        continue;
      }

      if (record.status === AttendanceStatusEnum.ATTENDED) {
        failures.push({ email: record.email, success: false });
        continue;
      }

      try {
        if (!record.invitationToken) {
          record.invitationToken = randomBytes(32).toString('hex');
          await record.save();
        }

        const qrBuffer = await QRCode.toBuffer(record.invitationToken, {
          type: 'png',
          width: 400,
          margin: 1,
        });
        const qrCid = `invitation-qr-${record._id.toString()}@tedx`;

        await this.emailsService.sendPersonalizedHtml({
          to: record.email,
          subject: dto.subject,
          htmlMessage: dto.htmlMessage,
          imageUrl: dto.imageUrl,
          inlineAttachments: [
            {
              filename: 'invitation-qr.png',
              content: qrBuffer,
              contentType: 'image/png',
              cid: qrCid,
            },
          ],
        });

        record.status = AttendanceStatusEnum.INVITED;
        record.invitationSentAt = new Date();
        await record.save();

        deliveries.push({ email: record.email, success: true });
      } catch {
        failures.push({ email: record.email, success: false });
      }
    }

    return {
      message: 'Invitation emails processed',
      sent: deliveries.length,
      failed: failures.length,
      deliveries,
      failures,
    };
  }

  async revoke(dto: RevokeAttendanceDto): Promise<RevokeAttendanceResultDto> {
    const objectIds = dto.attendanceIds.map((id) => new Types.ObjectId(id));
    const result = await this.attendanceModel.updateMany(
      {
        _id: { $in: objectIds },
        status: {
          $in: [
            AttendanceStatusEnum.ACCEPTED,
            AttendanceStatusEnum.INVITED,
          ],
        },
      },
      { $set: { status: AttendanceStatusEnum.REVOKED } },
    );

    const revokedDocs = await this.attendanceModel
      .find({
        _id: { $in: objectIds },
        status: AttendanceStatusEnum.REVOKED,
      })
      .select('_id')
      .exec();

    return {
      revoked: result.modifiedCount,
      attendanceIds: revokedDocs.map((d) => d._id.toString()),
    };
  }

  async scan(
    dto: ScanAttendanceDto,
    checkedInByUserId: string,
  ): Promise<ScanAttendanceResultDto> {
    const token = dto.token.trim();
    if (!token) {
      return { valid: false, reason: 'invalid' };
    }

    const updated = await this.attendanceModel
      .findOneAndUpdate(
        {
          invitationToken: token,
          status: AttendanceStatusEnum.INVITED,
        },
        {
          $set: {
            status: AttendanceStatusEnum.ATTENDED,
            attendedAt: new Date(),
            checkedInBy: new Types.ObjectId(checkedInByUserId),
          },
        },
        { new: true },
      )
      .exec();

    if (updated) {
      return {
        valid: true,
        attendance: this.toResponse(updated),
        attendedAt: updated.attendedAt,
      };
    }

    const existing = await this.attendanceModel
      .findOne({ invitationToken: token })
      .exec();

    if (!existing) {
      return { valid: false, reason: 'invalid' };
    }

    if (existing.status === AttendanceStatusEnum.ATTENDED) {
      return {
        valid: false,
        reason: 'already_attended',
        attendance: this.toResponse(existing),
        attendedAt: existing.attendedAt,
      };
    }

    if (existing.status === AttendanceStatusEnum.REVOKED) {
      return {
        valid: false,
        reason: 'revoked',
        attendance: this.toResponse(existing),
      };
    }

    return { valid: false, reason: 'invalid' };
  }

  private async assertEventExists(eventId: string): Promise<void> {
    await this.eventsService.findOne(eventId, 'en');
  }

  private toResponse(doc: AttendanceDocument): AttendanceResponseDto {
    const plain = doc.toObject({ virtuals: false }) as Attendance & {
      _id: Types.ObjectId;
      createdAt?: Date;
      updatedAt?: Date;
    };

    return {
      id: plain._id.toString(),
      eventId: plain.eventId.toString(),
      formTemplateId: plain.formTemplateId?.toString(),
      submissionId: plain.submissionId?.toString(),
      email: plain.email,
      name: plain.name,
      status: plain.status,
      invitationSentAt: plain.invitationSentAt,
      attendedAt: plain.attendedAt,
      checkedInBy: plain.checkedInBy?.toString(),
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
