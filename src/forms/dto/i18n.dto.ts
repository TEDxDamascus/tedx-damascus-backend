import { IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class I18nDto {
  @IsString()
  en: string;

  @IsString()
  ar: string;
}
