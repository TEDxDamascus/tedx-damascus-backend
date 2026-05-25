import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WallBlockedWordDocument = HydratedDocument<WallBlockedWord> & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class WallBlockedWord {
  @Prop({ required: true, unique: true, trim: true })
  word: string;
}

export const WallBlockedWordSchema =
  SchemaFactory.createForClass(WallBlockedWord);
