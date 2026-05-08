import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

const localizedStringSchema = {
  ar: { type: String, trim: true, default: '' },
  en: { type: String, trim: true, default: '' },
};

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: localizedStringSchema, required: true })
  name: { ar: string; en: string };

  @Prop({ type: localizedStringSchema, required: true })
  description: { ar: string; en: string };
}

export const CategorySchema = SchemaFactory.createForClass(Category);
