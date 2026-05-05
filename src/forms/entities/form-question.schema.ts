import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { QuestionOption, QuestionOptionSchema } from './question-option.schema';

export const QUESTION_TYPES = [
  'short_text',
  'long_text',
  'single_choice',
  'checkbox_group',
  'date',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

@Schema({ _id: true })
export class FormQuestion {
  @Prop({ required: true })
  orderIndex: number;

  @Prop({ type: String, required: true, enum: QUESTION_TYPES })
  type: QuestionType;

  @Prop({
    type: {
      en: { type: String, default: '' },
      ar: { type: String, default: '' },
      _id: false,
    },
    required: true,
  })
  title: { en: string; ar: string };

  @Prop({
    type: {
      en: { type: String, default: '' },
      ar: { type: String, default: '' },
      _id: false,
    },
    required: false,
  })
  helpText?: { en: string; ar: string };

  @Prop({ default: false })
  isRequired: boolean;

  @Prop({ type: Object, default: {} })
  config: Record<string, unknown>;

  @Prop({ type: [QuestionOptionSchema], default: [] })
  options: QuestionOption[];
}

export const FormQuestionSchema = SchemaFactory.createForClass(FormQuestion);
