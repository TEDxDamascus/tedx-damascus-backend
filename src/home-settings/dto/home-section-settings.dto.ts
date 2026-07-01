import { IsBoolean, IsNumber, IsObject, IsOptional } from 'class-validator';

export class HomeSectionSettingsDto {
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
