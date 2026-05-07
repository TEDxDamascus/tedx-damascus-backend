import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HeroSettingsDto } from './hero-settings.dto';
import { HomeSectionSettingsDto } from './home-section-settings.dto';

export class CreateHomeSettingsDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HeroSettingsDto)
  hero?: HeroSettingsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => HomeSectionSettingsDto)
  sections?: Record<string, HomeSectionSettingsDto>;
}
