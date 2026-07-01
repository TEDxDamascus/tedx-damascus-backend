import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlogReferenceDocument = BlogReference &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class BlogReference {
  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true })
  blog_id: Types.ObjectId;

  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String, trim: true, default: '' })
  desc: string;

  @Prop({ type: String, trim: true, required: true })
  url: string;
}

export const BlogReferenceSchema = SchemaFactory.createForClass(BlogReference);

BlogReferenceSchema.index({ blog_id: 1 });
