import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  SubmissionAnswer,
  SubmissionAnswerSchema,
} from './submission-answer.schema';

export const SUBMISSION_STATUSES = ['draft', 'submitted'] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export type FormSubmissionDocument = HydratedDocument<FormSubmission>;

@Schema({ timestamps: true })
export class FormSubmission {
  @Prop({ type: Types.ObjectId, ref: 'FormTemplate', required: true })
  formTemplateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: SUBMISSION_STATUSES,
    default: 'submitted',
  })
  status: SubmissionStatus;

  /** Set only when status is submitted. */
  @Prop({ required: false })
  submittedAt?: Date;

  @Prop({ type: [SubmissionAnswerSchema], default: [] })
  answers: SubmissionAnswer[];
}

export const FormSubmissionSchema =
  SchemaFactory.createForClass(FormSubmission);

FormSubmissionSchema.index({ formTemplateId: 1, userId: 1 }, { unique: true });
