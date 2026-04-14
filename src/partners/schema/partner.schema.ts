import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';

@Schema({ timestamps: true })
export class Partner {
  //! name
  @Prop({ required: true, _id: false, type: translationSchema })
  name!: TranslationField;

  //! image
  @Prop({ required: true }) //TODO connect it to be from the Storage
  image!: string;

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
