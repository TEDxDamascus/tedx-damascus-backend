import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';

@Schema()
export class Team {
  //! name
  @Prop({
    required: false,
    type: translationSchema,
    _id: false,
  })
  name!: TranslationField; //TODO later later take from storage service
  //! image
  @Prop()
  image!: string;
  //! year joined
  @Prop()
  year!: number;
  //! social links
  @Prop()
  social_link!: string[]; //TODO make this object of brand:link
  //! bio
  @Prop({
    required: false,
    type: translationSchema,
    _id: false,
  })
  bio!: TranslationField;
}
export const TeamSchema = SchemaFactory.createForClass(Team);
