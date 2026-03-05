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

  @Prop({ type: [FormQuestionSchema], default: [] })
  questions: FormQuestion[];
}

export const FormTemplateSchema = SchemaFactory.createForClass(FormTemplate);
