import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type HomeSettingsDocument = HomeSettings &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

const heroSchema = {
  isVisible: { type: Boolean, default: true },
  order: { type: Number },
  settings: { type: MongooseSchema.Types.Mixed, default: {} },
};

const sectionSchema = new MongooseSchema(
  {
    isVisible: { type: Boolean, default: true },
    order: { type: Number },
    settings: { type: MongooseSchema.Types.Mixed, default: {} },
  },
  {
    _id: false,
    strict: false,
  },
);

@Schema({ timestamps: true })
export class HomeSettings {
  @Prop({ type: heroSchema, default: () => ({ isVisible: true }) })
  hero?: {
    isVisible?: boolean;
    order?: number;
    settings?: Record<string, unknown>;
  };

  @Prop({
    type: Map,
    of: sectionSchema,
    default: () => ({ hero: { isVisible: true } }),
  })
  sections: Record<
    string,
    {
      isVisible?: boolean;
      order?: number;
      settings?: Record<string, unknown>;
    }
  >;
}

export const HomeSettingsSchema = SchemaFactory.createForClass(HomeSettings);
