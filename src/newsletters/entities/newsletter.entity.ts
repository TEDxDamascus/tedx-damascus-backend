import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NewsletterStatus } from '../enums/newsletter-status.enum';

export type NewsletterDocument = HydratedDocument<Newsletter>;

@Schema({ timestamps: true })
export class Newsletter {
  @Prop({ required: true, trim: true, maxlength: 200 })
  subject: string;

  @Prop({ required: true, maxlength: 30000 })
  content: string;

  @Prop({ enum: NewsletterStatus, default: NewsletterStatus.DRAFT })
  status: NewsletterStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sentBy?: Types.ObjectId;

  @Prop()
  sentAt?: Date;

  @Prop({ default: 0 })
  sentCount: number;

  @Prop({ default: 0 })
  failedCount: number;

  @Prop({ type: [{ email: String, status: String, reason: String }], default: [] })
  deliveryResults?: Array<{ email: string; status: 'sent' | 'failed'; reason?: string }>;
}

export const NewsletterSchema = SchemaFactory.createForClass(Newsletter);
