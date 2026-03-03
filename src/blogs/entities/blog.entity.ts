import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlogDocument = Blog & Document;

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true })
  title: string;

  @Prop()
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Image' })
  og_image: Types.ObjectId;

  @Prop()
  description: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 'draft' })
  status: string; // draft | published

  @Prop()
  category: string;

  @Prop({ default: 0 })
  views_count: number;

  @Prop({ default: 0 })
  read_time: number;

  @Prop()
  meta_title: string;

  @Prop()
  meta_description: string;

  // ✅ NEW FIELD
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Image' }] })
  gallery: Types.ObjectId[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);