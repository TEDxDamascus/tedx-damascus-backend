import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { UserPermission } from '../entities/user.entity';

export class UpdateUserPermissionsDto {
  @IsOptional()
  @IsArray()
  @IsEnum(UserPermission, { each: true })
  permissions?: UserPermission[];
}
