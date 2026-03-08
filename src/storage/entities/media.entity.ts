import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
})
export class Media {
  @Prop({ required: true })
  basename: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  format: string;

  @Prop({ required: true })
  size: number;

  @Prop({ default: true })
  is_active: boolean;

  // Provided automatically by the timestamps option
  createdAt: Date;
}

export type MediaDocument = Media & Document;

export const MediaSchema = SchemaFactory.createForClass(Media);

