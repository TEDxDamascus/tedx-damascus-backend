import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';
import type { TranslationField } from '../../common/type/translation-field';
import { translationSchema } from '../../common/utils/translation.schema';
import { Speaker } from '../../speakers/schemas/speaker.schema';
import { Media } from '../../storage/entities/media.entity';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsPhoneNumber,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

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

  //! Event Image (optional)
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Media' })
  event_image?: Media;

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

  //! Location Description
  @Prop({
    required: true,
    type: translationSchema,
    _id: false,
  })
  location_description: TranslationField;

  //! Location Email
  @Prop({ required: true })
  @IsEmail()
  location_email: string;

  //! Location PhoneNumber
  @Prop({ required: true })
  @IsPhoneNumber()
  location_phone: string;

  //! longitude, latitude (order matter)
  @Prop({
    type: [Number],
    required: true,
  })
  coordinates: [number, number];

  //! Date
  @Prop({ required: true })
  date: Date;

  //! Gallery (optional)
  @Prop({
    required: false,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
  })
  gallery?: Media[];

  //! Speakers
  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Speaker' }],
  })
  speakers: Speaker[];

  @Prop({ required: true })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  volunteers_count?: number;

  //! Is_deleted
  @Prop({ required: false, default: false })
  is_deleted: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// waiting for Speaker Module and the Image

EventSchema.index({
  'title.en': 'text',
  'title.ar': 'text',
});
