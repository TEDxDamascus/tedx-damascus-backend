import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';
import { Media } from 'src/storage/entities/media.entity';

//! PARTNER SERVICE SCHEMA
@Schema({ _id: false })
export class PartnerService {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, _id: false, type: translationSchema })
  description!: TranslationField;
}
export const PartnerServiceSchema =
  SchemaFactory.createForClass(PartnerService);

//! PARTNER SCHEMA
@Schema({ timestamps: true })
export class Partner {
  //! name
  @Prop({ required: true, _id: false, type: translationSchema })
  name!: TranslationField;

  //! image
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Media' })
  image!: Media;

  //! Slug
  @Prop({ required: true, _id: false, type: translationSchema })
  slug!: TranslationField;

  //! partnership type
  @Prop({ required: true })
  partnership_type!: string; //TODO make enum type for it

  //! description
  @Prop({ required: true, _id: false, type: translationSchema })
  short_description!: TranslationField;

  @Prop({ required: true, _id: false, type: translationSchema })
  long_description!: TranslationField;

  //! social links
  @Prop({ required: true })
  social_links!: string[];

  //! contact info
  @Prop({
    required: true,
    _id: false,
    type: {
      address: translationSchema,
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
  })
  contact_info!: {
    address: TranslationField;
    phone: string;
    email: string;
  };

  // services
  @Prop({ required: true, _id: false, type: [PartnerServiceSchema] })
  services!: PartnerService[];
}
export const PartnerSchema = SchemaFactory.createForClass(Partner);
