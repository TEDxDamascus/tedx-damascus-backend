import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;
  @Prop({ required: true, enum: EventType })
  event_type: EventType;
  @Prop({ required: true })
  event_image: string; //!ObjectId ref is Image
  @Prop({ required: true, enum: EventStatus })
  status: EventStatus;
  @Prop({ required: true })
  description: string;
  @Prop({ required: false })
  brief: string;
  @Prop({ required: true })
  location: string;
  @Prop({ required: true })
  date: Date;
  @Prop({ required: true })
  gallery: string[]; //! ObjectId ref is Image
  @Prop({ required: true })
  speakers: string[]; //! ObjectId ref is Speaker
  @Prop({ required: false, default: false })
  is_deleted: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// waiting for Speaker Module and the Image