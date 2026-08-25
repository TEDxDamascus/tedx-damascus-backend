import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { TranslationField } from 'src/common/type/translation-field';
import { translationSchema } from 'src/common/utils/translation.schema';
import { Media } from 'src/storage/entities/media.entity';
import { Event } from 'src/events/schema/event.schema';

@Schema({
  timestamps: true,
})
export class Team {
  //! name
  @Prop({
    required: true,
    type: translationSchema,
    _id: false,
  })
  name!: TranslationField;
  //! image
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Media' })
  image!: Media;
  @Prop({ required: true, type: Number, id: false })
  year!: number;
  //! role
  @Prop({
    required: false,
    type: translationSchema,
    _id: false,
  })
  role!: TranslationField;
  //! events
  @Prop({
    required: false,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  })
  events!: Event[];
  //! category
  @Prop({
    required: false,
    type: translationSchema,
    _id: false,
  })
  category!: TranslationField;
  //! social links
  @Prop({ required: true, type: [String], id: false })
  social_links!: string[]; //TODO make this object of brand:link
  //! bio
  @Prop({
    required: true,
    type: translationSchema,
    _id: false,
  })
  bio!: TranslationField;
}
export const TeamSchema = SchemaFactory.createForClass(Team);
