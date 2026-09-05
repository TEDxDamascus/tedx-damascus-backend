import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { EmailsService } from '../emails/emails.service';
import { EventsService } from '../events/events.service';
import { FormSubmission } from '../forms/entities/form-submission.schema';
import { FormTemplate } from '../forms/entities/form-template.schema';
import { AttendanceService } from './attendance.service';
import { AttendanceStatusEnum } from './enums/attendance-status.enum';
import { Attendance } from './schema/attendance.schema';

jest.mock('qrcode', () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-qr')),
}));

jest.mock('../events/events.service', () => ({
  EventsService: class EventsService {},
}));

jest.mock('../emails/emails.service', () => ({
  EmailsService: class EmailsService {},
}));

describe('AttendanceService', () => {
  let service: AttendanceService;

  const attendanceModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
  };

  const formSubmissionModel = {
    find: jest.fn(),
  };

  const formTemplateModel = {
    find: jest.fn(),
  };

  const eventsService = {
    findOne: jest.fn(),
  };

  const emailsService = {
    sendPersonalizedHtml: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getModelToken(Attendance.name), useValue: attendanceModel },
        {
          provide: getModelToken(FormSubmission.name),
          useValue: formSubmissionModel,
        },
        {
          provide: getModelToken(FormTemplate.name),
          useValue: formTemplateModel,
        },
        { provide: EventsService, useValue: eventsService },
        { provide: EmailsService, useValue: emailsService },
      ],
    }).compile();

    service = module.get(AttendanceService);
  });

  function makeAttendanceDoc(overrides: Record<string, unknown> = {}) {
    const id = new Types.ObjectId();
    const doc = {
      _id: id,
      eventId: new Types.ObjectId(),
      email: 'guest@example.com',
      status: AttendanceStatusEnum.ACCEPTED,
      invitationToken: undefined as string | undefined,
      invitationSentAt: undefined as Date | undefined,
      attendedAt: undefined as Date | undefined,
      checkedInBy: undefined as Types.ObjectId | undefined,
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockImplementation(function (this: typeof doc) {
        return {
          _id: this._id,
          eventId: this.eventId,
          email: this.email,
          status: this.status,
          invitationToken: this.invitationToken,
          invitationSentAt: this.invitationSentAt,
          attendedAt: this.attendedAt,
          checkedInBy: this.checkedInBy,
        };
      }),
      ...overrides,
    };
    doc.save.mockImplementation(async () => doc);
    return doc;
  }

  describe('invite', () => {
    it('generates a token once and reuses it on re-send', async () => {
      const doc = makeAttendanceDoc();
      attendanceModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([doc]),
      });
      emailsService.sendPersonalizedHtml.mockResolvedValue({
        email: doc.email,
        success: true,
      });

      const first = await service.invite({
        attendanceIds: [doc._id.toString()],
        subject: 'Invite',
        htmlMessage: '<p>Hello</p>',
      });
      const firstToken = doc.invitationToken;

      expect(first.sent).toBe(1);
      expect(firstToken).toBeDefined();
      expect(emailsService.sendPersonalizedHtml).toHaveBeenCalledTimes(1);

      await service.invite({
        attendanceIds: [doc._id.toString()],
        subject: 'Invite again',
        htmlMessage: '<p>Hello again</p>',
      });

      expect(doc.invitationToken).toBe(firstToken);
      expect(emailsService.sendPersonalizedHtml).toHaveBeenCalledTimes(2);
      expect(doc.status).toBe(AttendanceStatusEnum.INVITED);
    });
  });

  describe('revoke', () => {
    it('revokes accepted and invited records', async () => {
      const id = new Types.ObjectId();
      attendanceModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
      attendanceModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: id }]),
        }),
      });

      const result = await service.revoke({
        attendanceIds: [id.toString()],
      });

      expect(result.revoked).toBe(1);
      expect(result.attendanceIds).toEqual([id.toString()]);
      expect(attendanceModel.updateMany).toHaveBeenCalled();
    });
  });

  describe('scan', () => {
    it('checks in invited attendance atomically', async () => {
      const doc = makeAttendanceDoc({
        status: AttendanceStatusEnum.ATTENDED,
        attendedAt: new Date('2026-08-21T10:00:00.000Z'),
      });
      attendanceModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      const result = await service.scan(
        { token: 'token-1' },
        new Types.ObjectId().toString(),
      );

      expect(result.valid).toBe(true);
      expect(result.attendedAt).toEqual(doc.attendedAt);
    });

    it('returns already_attended on double scan', async () => {
      attendanceModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      const existing = makeAttendanceDoc({
        status: AttendanceStatusEnum.ATTENDED,
        attendedAt: new Date('2026-08-21T09:00:00.000Z'),
        invitationToken: 'token-1',
      });
      attendanceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existing),
      });

      const result = await service.scan(
        { token: 'token-1' },
        new Types.ObjectId().toString(),
      );

      expect(result).toEqual(
        expect.objectContaining({
          valid: false,
          reason: 'already_attended',
          attendedAt: existing.attendedAt,
        }),
      );
    });

    it('returns revoked when invitation was revoked', async () => {
      attendanceModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      const existing = makeAttendanceDoc({
        status: AttendanceStatusEnum.REVOKED,
        invitationToken: 'token-1',
      });
      attendanceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existing),
      });

      const result = await service.scan(
        { token: 'token-1' },
        new Types.ObjectId().toString(),
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('revoked');
    });
  });

  describe('createManual', () => {
    it('throws when event does not exist', async () => {
      eventsService.findOne.mockRejectedValue(
        new NotFoundException('Event not found'),
      );

      await expect(
        service.createManual({
          eventId: new Types.ObjectId().toString(),
          email: 'a@b.com',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
