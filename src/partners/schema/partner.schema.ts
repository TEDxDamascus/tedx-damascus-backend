import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';
import { Media } from 'src/storage/entities/media.entity';

@Schema({ timestamps: true })
export class Partner {
  //! name
  @Prop({ required: true, _id: false, type: translationSchema })
  name!: TranslationField;

  //! image
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Media' })
  image!: Media;

  //! Slug
  @Prop({ required: true, _id: false, type: translationSchema })
  slug!: TranslationField;

  //! partnership type
  @Prop({ required: true })
  partnership_type!: string; //TODO make enum type for it

  //! description
  @Prop({ required: true, _id: false, type: translationSchema })
  description!: TranslationField;

  //! social links
  @Prop({ required: true })
  social_links!: string[];
}
export const PartnerSchema = SchemaFactory.createForClass(Partner);
