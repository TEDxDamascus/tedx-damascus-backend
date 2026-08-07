import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NewsletterSubscriberDocument = HydratedDocument<NewsletterSubscriber>;

@Schema({ timestamps: true })
export class NewsletterSubscriber {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const NewsletterSubscriberSchema = SchemaFactory.createForClass(NewsletterSubscriber);
