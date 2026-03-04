import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: true })
export class QuestionOption {
  @Prop({ required: true })
  orderIndex: number;

  @Prop({
    type: {
      en: { type: String, default: '' },
      ar: { type: String, default: '' },
    },
    required: true,
  })
  label: { en: string; ar: string };
}

export const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);
