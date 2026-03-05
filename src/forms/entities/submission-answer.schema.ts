import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: true })
export class SubmissionAnswer {
  @Prop({ type: Types.ObjectId, required: true })
  questionId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  value: string | Date | boolean | Types.ObjectId | Types.ObjectId[];
}

export const SubmissionAnswerSchema =
  SchemaFactory.createForClass(SubmissionAnswer);
