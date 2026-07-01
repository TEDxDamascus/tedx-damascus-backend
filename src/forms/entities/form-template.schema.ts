import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FormQuestion, FormQuestionSchema } from './form-question.schema';

export const FORM_STATUSES = ['Draft', 'Published'] as const;
export const TARGET_ROLES = ['Speaker', 'Partner', 'Attender'] as const;

export type FormStatus = (typeof FORM_STATUSES)[number];
export type TargetRole = (typeof TARGET_ROLES)[number];

export type FormTemplateDocument = HydratedDocument<FormTemplate>;

@Schema({ timestamps: true })
export class FormTemplate {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdByAdminId?: Types.ObjectId;

  @Prop({ type: String, required: true, enum: TARGET_ROLES })
  targetRole: TargetRole;

  @Prop({ type: String, required: true, enum: FORM_STATUSES, default: 'Draft' })
  status: FormStatus;

  @Prop({
    type: {
      en: { type: String, default: '' },
      ar: { type: String, default: '' },
      _id: false,
    },
    required: true,
  })
  name: { en: string; ar: string };

  @Prop({
    type: {
      en: { type: String, default: '' },
      ar: { type: String, default: '' },
      _id: false,
    },
    required: false,
  })
  description?: { en: string; ar: string };

  @Prop({ required: false })
  publishedAt?: Date;

  /** Inclusive start of submission window (UTC). */
  @Prop({ required: false })
  starts_at?: Date;

  /** Inclusive end of submission window (UTC). */
  @Prop({ required: false })
  ends_at?: Date;

  /** After this instant, form is expired (410 on submit). */
  @Prop({ required: false })
  expires_at?: Date;

  /** Max total submissions; omit for unlimited. */
  @Prop({ required: false })
  max_submissions?: number;

  /** Human-readable URL slugs. Used in shareable URLs. Unique per locale. */
  @Prop({
    type: {
      en: { type: String, default: '' },
      ar: { type: String, default: '' },
      _id: false,
    },
    required: false,
  })
  slug?: { en: string; ar: string };

  /** Full absolute URLs for sharing. Derived from slug; regenerated when slug changes. */
  @Prop({
    type: {
      en: { type: String, default: '' },
      ar: { type: String, default: '' },
      _id: false,
    },
    required: false,
  })
  shareable_url?: { en: string; ar: string };

  @Prop({ type: [FormQuestionSchema], default: [] })
  questions: FormQuestion[];
}

export const FormTemplateSchema = SchemaFactory.createForClass(FormTemplate);
FormTemplateSchema.index(
  { 'slug.en': 1 },
  {
    unique: true,
    partialFilterExpression: { 'slug.en': { $exists: true, $ne: '', $type: 'string' } },
  },
);
FormTemplateSchema.index(
  { 'slug.ar': 1 },
  {
    unique: true,
    partialFilterExpression: { 'slug.ar': { $exists: true, $ne: '', $type: 'string' } },
  },
);
