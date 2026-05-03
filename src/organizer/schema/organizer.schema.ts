import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Organizer {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  image!: string;

  @Prop({ required: true })
  bio!: string;

  @Prop({ required: true })
  social_links!: string[];

  @Prop({ required: true })
  role!: string;

  @Prop({ required: true })
  gallery!: string[];
}

export const OrganizerSchema = SchemaFactory.createForClass(Organizer);
