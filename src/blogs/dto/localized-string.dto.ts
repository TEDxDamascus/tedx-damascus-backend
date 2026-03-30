import { IsString } from 'class-validator';

export class LocalizedStringDto {
  @IsString()
  ar: string;

  @IsString()
  en: string;
}
