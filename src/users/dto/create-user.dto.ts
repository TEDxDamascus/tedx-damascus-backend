import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserPermission, UserRole } from '../entities/user.entity';
import { LocalizedStringDto } from './localized-string.dto';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @IsOptional()
  @IsMongoId()
  profile_image?: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsArray()
  @IsEnum(UserPermission, { each: true })
  permissions?: UserPermission[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
