import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const WALL_ANSWER_STATUSES = ['pending', 'public', 'archived'] as const;

export type WallAnswerStatus = (typeof WALL_ANSWER_STATUSES)[number];

export type WallAnswerDocument = HydratedDocument<WallAnswer>;

@Schema({ timestamps: true })
export class WallAnswer {
  @Prop({ type: Types.ObjectId, ref: 'WallQuestion', required: true })
  questionId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ required: false, trim: true })
  displayName?: string;

  @Prop({
    type: String,
    required: true,
    enum: WALL_ANSWER_STATUSES,
    default: 'pending',
  })
  status: WallAnswerStatus;

  @Prop({ required: true, default: () => new Date() })
  submittedAt: Date;

  @Prop({ required: false })
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  approvedBy?: Types.ObjectId;
}

export const WallAnswerSchema = SchemaFactory.createForClass(WallAnswer);

WallAnswerSchema.index({ questionId: 1, status: 1, createdAt: -1 });
