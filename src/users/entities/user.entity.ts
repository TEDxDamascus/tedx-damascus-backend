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
  BLOGS_READ = 'blogs:read',
  BLOGS_CREATE = 'blogs:create',
  BLOGS_UPDATE = 'blogs:update',
  BLOGS_DELETE = 'blogs:delete',
  EVENTS_READ = 'events:read',
  EVENTS_CREATE = 'events:create',
  EVENTS_UPDATE = 'events:update',
  EVENTS_DELETE = 'events:delete',
  SPEAKERS_READ = 'speakers:read',
  SPEAKERS_CREATE = 'speakers:create',
  SPEAKERS_UPDATE = 'speakers:update',
  SPEAKERS_DELETE = 'speakers:delete',
  TEAM_READ = 'team:read',
  TEAM_CREATE = 'team:create',
  TEAM_UPDATE = 'team:update',
  TEAM_DELETE = 'team:delete',
  PARTNERS_READ = 'partners:read',
  PARTNERS_CREATE = 'partners:create',
  PARTNERS_UPDATE = 'partners:update',
  PARTNERS_DELETE = 'partners:delete',
  ORGANIZER_READ = 'organizer:read',
  ORGANIZER_CREATE = 'organizer:create',
  ORGANIZER_UPDATE = 'organizer:update',
  ORGANIZER_DELETE = 'organizer:delete',
  CATEGORIES_READ = 'categories:read',
  CATEGORIES_CREATE = 'categories:create',
  CATEGORIES_UPDATE = 'categories:update',
  CATEGORIES_DELETE = 'categories:delete',
  BLOG_REFERENCES_READ = 'blog-references:read',
  BLOG_REFERENCES_CREATE = 'blog-references:create',
  BLOG_REFERENCES_UPDATE = 'blog-references:update',
  BLOG_REFERENCES_DELETE = 'blog-references:delete',
  MEDIA_READ = 'media:read',
  MEDIA_CREATE = 'media:create',
  MEDIA_UPDATE = 'media:update',
  MEDIA_DELETE = 'media:delete',
  HOME_SETTINGS_READ = 'home-settings:read',
  HOME_SETTINGS_CREATE = 'home-settings:create',
  HOME_SETTINGS_UPDATE = 'home-settings:update',
  HOME_SETTINGS_DELETE = 'home-settings:delete',
  FORMS_READ = 'forms:read',
  FORMS_CREATE = 'forms:create',
  FORMS_UPDATE = 'forms:update',
  FORMS_DELETE = 'forms:delete',
  FORMS_PUBLISH = 'forms:publish',
  FORMS_SUBMISSIONS_READ = 'forms:submissions:read',
  FORMS_SUBMISSIONS_EXPORT = 'forms:submissions:export',
  WALL_CARDS_READ = 'wall-cards:read',
  WALL_CARDS_UPDATE = 'wall-cards:update',
  WALL_CARDS_MODERATE = 'wall-cards:moderate',
  WALL_CARDS_BLOCKED_WORDS_MANAGE = 'wall-cards:blocked-words:manage',
}

export const USER_MANAGEMENT_PERMISSIONS: UserPermission[] = [
  UserPermission.USERS_READ,
  UserPermission.USERS_CREATE,
  UserPermission.USERS_UPDATE,
  UserPermission.USERS_DELETE,
];

export const ADMIN_DEFAULT_PERMISSIONS: UserPermission[] = [];

export const SUPERADMIN_DEFAULT_PERMISSIONS: UserPermission[] = [
  ...USER_MANAGEMENT_PERMISSIONS,
  UserPermission.BLOGS_READ,
  UserPermission.BLOGS_CREATE,
  UserPermission.BLOGS_UPDATE,
  UserPermission.BLOGS_DELETE,
  UserPermission.EVENTS_READ,
  UserPermission.EVENTS_CREATE,
  UserPermission.EVENTS_UPDATE,
  UserPermission.EVENTS_DELETE,
  UserPermission.SPEAKERS_READ,
  UserPermission.SPEAKERS_CREATE,
  UserPermission.SPEAKERS_UPDATE,
  UserPermission.SPEAKERS_DELETE,
  UserPermission.TEAM_READ,
  UserPermission.TEAM_CREATE,
  UserPermission.TEAM_UPDATE,
  UserPermission.TEAM_DELETE,
  UserPermission.PARTNERS_READ,
  UserPermission.PARTNERS_CREATE,
  UserPermission.PARTNERS_UPDATE,
  UserPermission.PARTNERS_DELETE,
  UserPermission.ORGANIZER_READ,
  UserPermission.ORGANIZER_CREATE,
  UserPermission.ORGANIZER_UPDATE,
  UserPermission.ORGANIZER_DELETE,
  UserPermission.CATEGORIES_READ,
  UserPermission.CATEGORIES_CREATE,
  UserPermission.CATEGORIES_UPDATE,
  UserPermission.CATEGORIES_DELETE,
  UserPermission.BLOG_REFERENCES_READ,
  UserPermission.BLOG_REFERENCES_CREATE,
  UserPermission.BLOG_REFERENCES_UPDATE,
  UserPermission.BLOG_REFERENCES_DELETE,
  UserPermission.MEDIA_READ,
  UserPermission.MEDIA_CREATE,
  UserPermission.MEDIA_UPDATE,
  UserPermission.MEDIA_DELETE,
  UserPermission.HOME_SETTINGS_READ,
  UserPermission.HOME_SETTINGS_CREATE,
  UserPermission.HOME_SETTINGS_UPDATE,
  UserPermission.HOME_SETTINGS_DELETE,
  UserPermission.FORMS_READ,
  UserPermission.FORMS_CREATE,
  UserPermission.FORMS_UPDATE,
  UserPermission.FORMS_DELETE,
  UserPermission.FORMS_PUBLISH,
  UserPermission.FORMS_SUBMISSIONS_READ,
  UserPermission.FORMS_SUBMISSIONS_EXPORT,
  UserPermission.WALL_CARDS_READ,
  UserPermission.WALL_CARDS_UPDATE,
  UserPermission.WALL_CARDS_MODERATE,
  UserPermission.WALL_CARDS_BLOCKED_WORDS_MANAGE,
];

@Schema({ timestamps: true })
export class User {
  @Prop({ required: false, trim: true })
  name?: string;

  @Prop({ type: localizedStringSchema, default: () => ({ ar: '', en: '' }) })
  description: { ar: string; en: string };

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
