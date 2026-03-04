import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserPermission {
  USERS_READ = 'users:read',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
}

export const ADMIN_DEFAULT_PERMISSIONS: UserPermission[] = [
  UserPermission.USERS_READ,
  UserPermission.USERS_CREATE,
  UserPermission.USERS_UPDATE,
  UserPermission.USERS_DELETE,
];

@Schema({ timestamps: true })
export class User {
  @Prop({ required: false, trim: true })
  name?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: [String], enum: UserPermission, default: [] })
  permissions: UserPermission[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: String, select: false, default: null })
  refresh_token: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
