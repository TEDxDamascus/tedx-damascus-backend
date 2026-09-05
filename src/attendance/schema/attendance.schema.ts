import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ATTENDANCE_STATUSES,
  AttendanceStatusEnum,
} from '../enums/attendance-status.enum';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FormTemplate', required: false })
  formTemplateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FormSubmission', required: false })
  submissionId?: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false, trim: true })
  name?: string;

  @Prop({
    type: String,
    required: true,
    enum: ATTENDANCE_STATUSES,
    default: AttendanceStatusEnum.ACCEPTED,
  })
  status: AttendanceStatusEnum;

  @Prop({ required: false, trim: true })
  invitationToken?: string;

  @Prop({ required: false })
  invitationSentAt?: Date;

  @Prop({ required: false })
  attendedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  checkedInBy?: Types.ObjectId;
}


export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

AttendanceSchema.index(
  { eventId: 1, submissionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      submissionId: { $exists: true, $type: 'objectId' },
    },
  },
);

AttendanceSchema.index({ eventId: 1, email: 1 }, { unique: true });

AttendanceSchema.index(
  { invitationToken: 1 },
  {
    unique: true,
    sparse: true,
  },
);
