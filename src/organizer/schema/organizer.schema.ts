import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';
import { Media } from 'src/storage/entities/media.entity';

@Schema({ timestamps: true })
export class Organizer {
  @Prop({ required: true, type: translationSchema, _id: false })
  name!: TranslationField;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  })
  image!: Media;

  @Prop({ required: true, type: translationSchema, _id: false })
  bio!: TranslationField;

  @Prop({ required: true, type: [String], default: undefined })
  social_links!: string[];

  @Prop({ required: true })
  role!: string;

  @Prop({
    required: false,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    default: [],
  })
  gallery?: Media[];
}

export const OrganizerSchema = SchemaFactory.createForClass(Organizer);
