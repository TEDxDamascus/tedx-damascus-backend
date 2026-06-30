import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlogPermissionDocument = BlogPermission &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class BlogPermission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true })
  blogId: Types.ObjectId;

  @Prop({ default: false })
  canRead: boolean;

  @Prop({ default: false })
  canWrite: boolean;

  @Prop({ default: false })
  canCreate: boolean;

  @Prop({ default: false })
  canUpdate: boolean;

  @Prop({ default: false })
  canDelete: boolean;
}

export const BlogPermissionSchema =
  SchemaFactory.createForClass(BlogPermission);

BlogPermissionSchema.index({ adminId: 1, blogId: 1 }, { unique: true });
BlogPermissionSchema.index({ blogId: 1 });
