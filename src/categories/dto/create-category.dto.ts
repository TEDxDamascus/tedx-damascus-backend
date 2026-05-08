import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedStringDto } from './localized-string.dto';

export class CreateCategoryDto {
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description: LocalizedStringDto;
}
