import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TranslationDto } from 'src/common/dto/translation.dto';

export class ContactInfoDto {
  @IsDefined()
  @ValidateNested({
    message: 'address must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  address!: TranslationDto;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  email!: string;
}
