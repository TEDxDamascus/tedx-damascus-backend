import { IsInt, IsObject, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { I18nDto } from './i18n.dto';

export class CreateOptionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiProperty({ type: I18nDto })
  @IsObject()
  @ValidateNested()
  @Type(() => I18nDto)
  label: I18nDto;
}
