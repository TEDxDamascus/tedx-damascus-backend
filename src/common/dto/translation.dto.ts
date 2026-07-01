import { IsNotEmpty, IsString } from 'class-validator';

export class TranslationDto {
  @IsString({ message: 'en is required and must be a string' })
  @IsNotEmpty({ message: 'en cannot be empty' })
  en: string;

  @IsString({ message: 'ar is required and must be a string' })
  @IsNotEmpty({ message: 'ar cannot be empty' })
  ar: string;
}
