import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';
import type { TranslationField } from '../../common/type/translation-field';
import { translationSchema } from '../../common/utils/translation.schema';
import { Speaker } from 'src/speakers/schemas/speaker.schema';
import { Media } from 'src/storage/entities/media.entity';

@Schema({ timestamps: true })
export class Event {
  //! Title
  @Prop({
    required: true,
    type: translationSchema,
    _id: false,
  })
  title: TranslationField;

  //! Event_Type
  @Prop({ required: true, enum: EventType })
  event_type: EventType;

  //! Event Image
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Media' })
  event_image: Media;

  //! Event_Status
  @Prop({ required: true, enum: EventStatus })
  status: EventStatus;

  //! Description
  @Prop({
    required: true,
    _id: false,
    type: translationSchema,
  })
  description: TranslationField;

  //! Brief(optional)
  @Prop({
    required: false,
    type: translationSchema,
    _id: false,
  })
  brief: TranslationField;
  
  //! Location
  @Prop({
    required: true,
    type: translationSchema,
    _id: false,
  })
  location: TranslationField;
  
  //! Date
  @Prop({ required: true })
  date: Date;

  //! Gallery
  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
  })
  gallery: Media[];

  //! Speakers
  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Speaker' }],
  })
  speakers: Speaker[];
  
  //! Is_deleted
  @Prop({ required: false, default: false })
  is_deleted: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// waiting for Speaker Module and the Image
