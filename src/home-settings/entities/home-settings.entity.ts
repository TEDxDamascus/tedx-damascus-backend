import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HomeSettingsDocument = HomeSettings &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

const heroSchema = {
  isVisible: { type: Boolean, default: true },
};

@Schema({ timestamps: true })
export class HomeSettings {
  @Prop({ type: heroSchema, required: true, default: () => ({ isVisible: true }) })
  hero: {
    isVisible: boolean;
  };
}

export const HomeSettingsSchema = SchemaFactory.createForClass(HomeSettings);
