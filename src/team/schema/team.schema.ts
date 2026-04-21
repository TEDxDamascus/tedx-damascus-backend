import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';

@Schema()
export class Team {
  @Prop({
    required: false,
    type: translationSchema,
    _id: false,
  })
  name!: TranslationField;
  @Prop()
  image!: string;
  @Prop()
  social_link!: string[];
  @Prop({
    required: false,
    type: translationSchema,
    _id: false,
  })
  bio!: TranslationField;
}
export const TeamSchema = SchemaFactory.createForClass(Team);
