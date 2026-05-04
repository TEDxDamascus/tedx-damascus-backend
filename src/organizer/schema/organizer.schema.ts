import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';

@Schema({ timestamps: true })
export class Organizer {
  @Prop({ required: true, type: translationSchema, _id: false })
  name!: TranslationField;

  @Prop({ required: true })
  image!: string;

  @Prop({ required: true, type: translationSchema, _id: true })
  bio!: TranslationField;

  @Prop({ type: [String], default: [] })
  social_links!: string[];

  @Prop({ required: true })
  role!: string;

  @Prop({ type: [String], default: [] })
  gallery!: string[];
}

export const OrganizerSchema = SchemaFactory.createForClass(Organizer);
