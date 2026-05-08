import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlogDocument = Blog &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

const localizedStringSchema = {
  ar: { type: String, trim: true, default: '' },
  en: { type: String, trim: true, default: '' },
};

const localizedStringArraySchema = {
  ar: { type: [String], default: [] },
  en: { type: [String], default: [] },
};

@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: localizedStringSchema, required: true })
  title: { ar: string; en: string };

  @Prop({ type: localizedStringSchema, required: true })
  slug: { ar: string; en: string };

  @Prop({ type: Types.ObjectId, ref: 'Media' })
  blog_image?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Media' })
  og_image?: Types.ObjectId;

  @Prop({ type: localizedStringSchema, default: () => ({ ar: '', en: '' }) })
  description: { ar: string; en: string };

  @Prop({ type: localizedStringSchema, required: true })
  content: { ar: string; en: string };

  @Prop({
    type: localizedStringArraySchema,
    default: () => ({ ar: [], en: [] }),
  })
  tags: { ar: string[]; en: string[] };

  @Prop({ default: 'draft' })
  status: string;

  @Prop()
  publishedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user_id?: Types.ObjectId;

  @Prop({ default: 0 })
  views_count: number;

  @Prop({ default: 0 })
  read_time: number;

  @Prop({ type: localizedStringSchema, default: () => ({ ar: '', en: '' }) })
  meta_title: { ar: string; en: string };

  @Prop({ type: localizedStringSchema, default: () => ({ ar: '', en: '' }) })
  meta_description: { ar: string; en: string };

  @Prop({
    type: localizedStringArraySchema,
    default: () => ({ ar: [], en: [] }),
  })
  meta_keywords: { ar: string[]; en: string[] };

  @Prop()
  canonical_url?: string;

  @Prop({ type: localizedStringSchema, default: () => ({ ar: '', en: '' }) })
  og_title: { ar: string; en: string };

  @Prop({ type: localizedStringSchema, default: () => ({ ar: '', en: '' }) })
  og_description: { ar: string; en: string };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Media' }] })
  gallery: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Blog' }], default: [] })
  related_blogs_ids: Types.ObjectId[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.index({ category_id: 1 });

BlogSchema.index(
  { 'slug.en': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'slug.en': { $exists: true, $type: 'string', $ne: '' },
    },
  },
);

BlogSchema.index(
  { 'slug.ar': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'slug.ar': { $exists: true, $type: 'string', $ne: '' },
    },
  },
);
