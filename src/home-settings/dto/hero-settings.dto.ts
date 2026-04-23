import { IsBoolean } from 'class-validator';

export class HeroSettingsDto {
  @IsBoolean()
  isVisible: boolean;
}
