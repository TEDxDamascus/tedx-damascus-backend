import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { translationSchema } from '../../common/utils/translation.schema';

export const WALL_QUESTION_STATUSES = ['active', 'archived', 'expired'] as const;

export type WallQuestionStatus = (typeof WALL_QUESTION_STATUSES)[number];

export type WallQuestionDocument = HydratedDocument<WallQuestion> & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class WallQuestion {
  @Prop({ type: translationSchema, required: true })
  text: { en: string; ar: string };

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  categoryId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: String,
    required: true,
    enum: WALL_QUESTION_STATUSES,
    default: 'active',
  })
  status: WallQuestionStatus;

  @Prop({ required: true })
  publishedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  publishedBy?: Types.ObjectId;

  @Prop({ required: false })
  archivedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'WallQuestion', required: false })
  replacedByQuestionId?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'WallAnswer', default: [] })
  featuredAnswerIds: Types.ObjectId[];
}

export const WallQuestionSchema = SchemaFactory.createForClass(WallQuestion);

WallQuestionSchema.index({ status: 1, publishedAt: -1 });
WallQuestionSchema.index({ categoryId: 1 });
WallQuestionSchema.index({ tags: 1 });
WallQuestionSchema.index({ publishedAt: -1 });
WallQuestionSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } },
);
