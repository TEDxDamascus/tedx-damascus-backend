import {
  IsBoolean,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class CreateBlogPermissionDto {
  @IsMongoId()
  adminId: string;

  @IsMongoId()
  blogId: string;

  @IsOptional()
  @IsBoolean()
  canRead?: boolean;

  @IsOptional()
  @IsBoolean()
  canWrite?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  canUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;
}

export class UpdateBlogPermissionDto {
  @IsOptional()
  @IsBoolean()
  canRead?: boolean;

  @IsOptional()
  @IsBoolean()
  canWrite?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  canUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;
}

export class BlogPermissionQueryDto {
  @IsOptional()
  @IsMongoId()
  adminId?: string;

  @IsOptional()
  @IsMongoId()
  blogId?: string;
}
