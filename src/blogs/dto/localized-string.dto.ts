import { IsArray, IsString } from 'class-validator';

export class LocalizedStringDto {
  @IsString()
  ar: string;

  @IsString()
  en: string;
}

export class LocalizedStringArrayDto {
  @IsArray()
  @IsString({ each: true })
  ar: string[];

  @IsArray()
  @IsString({ each: true })
  en: string[];
}
