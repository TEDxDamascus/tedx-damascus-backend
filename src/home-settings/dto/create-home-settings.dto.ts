import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HeroSettingsDto } from './hero-settings.dto';

export class CreateHomeSettingsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => HeroSettingsDto)
  hero: HeroSettingsDto;
}
