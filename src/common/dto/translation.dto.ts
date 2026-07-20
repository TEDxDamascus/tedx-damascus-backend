import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class TranslationDto {
  @IsString({ message: 'en is required and must be a string' })
  @MinLength(4, { message: 'en must be at least 4 characters' })
  @MaxLength(1000, {
    message: 'en must not exceed 25 characters',
  })
  @IsNotEmpty({ message: 'en cannot be empty' })
  en: string;

  @IsString({ message: 'ar is required and must be a string' })
  @MinLength(4, { message: 'ar must be at least 4 characters' })
  @MaxLength(1000, {
    message: 'ar must not exceed 25 characters',
  })
  @IsNotEmpty({ message: 'ar cannot be empty' })
  ar: string;
}
