import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { TranslationField } from '../../common/type/translation-field';
import { translationSchema } from '../../common/utils/translation.schema';
import { Media } from 'src/storage/entities/media.entity';

@Schema({ timestamps: true })
export class Speaker {
  //! Name
  @Prop({
    required: true,
    type: translationSchema,
    _id: false,
  })
  name: TranslationField;

  //! Bio
  @Prop({
    required: true,
    type: translationSchema,
    _id: false,
  })
  bio: TranslationField;

  //! Description
  @Prop({
    required: true,
    type: translationSchema,
    _id: false,
  })
  description: TranslationField;

  //! Speaker Image
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  })
  speaker_image: Media;

  //! Social Link
  @Prop({ required: true })
  social_links: string[];

  //! Gallery
  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
  })
  gallery: Media[];

  //! Video Link
  @Prop({ required: true })
  video_link: string;
}
export const SpeakerSchema = SchemaFactory.createForClass(Speaker);
