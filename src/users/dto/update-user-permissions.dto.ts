import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CrudPermissionsDto {
  @IsOptional()
  @IsBoolean()
  create?: boolean;

  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsBoolean()
  update?: boolean;

  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}

export class UpdateUserPermissionsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CrudPermissionsDto)
  users?: CrudPermissionsDto;
}
