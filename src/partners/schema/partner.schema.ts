import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Partner {
  //! name
  @Prop({ required: true })
  name!: string;
  //! image
  @Prop({ required: true })
  image!: string;
  //! Slug
  @Prop({ required: true })
  slug!: string;
  //! partnership type
  @Prop({ required: true })
  partnership_type!: string;
  //! description
  @Prop({ required: true })
  description!: string;
  //! social links
  @Prop({ required: true })
  social_links!: string[];
}
export const PartnerSchema = SchemaFactory.createForClass(Partner);
