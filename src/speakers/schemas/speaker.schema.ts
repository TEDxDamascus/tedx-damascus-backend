import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';

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
    // type: mongoose.Schema.Types.ObjectId, ref: 'Media'
  })
  speaker_image: string;

  //! Social Link
  @Prop({ required: true })
  social_links: string[];

  //! Gallery
  @Prop({
    required: true,
    // type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
  })
  gallery: string[];

  //! Video Link
  @Prop({ required: true })
  video_link: string[];
}
export const SpeakerSchema = SchemaFactory.createForClass(Speaker);
