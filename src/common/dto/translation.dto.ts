import { IsNotEmpty, IsString } from 'class-validator';

export class TranslationDto {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  ar: string;
}
