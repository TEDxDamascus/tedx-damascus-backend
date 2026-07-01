import { Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { TranslationDto } from 'src/common/dto/translation.dto';

export class ServiceDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDefined()
  @ValidateNested({
    message: 'description must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  description!: TranslationDto;
}
