import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TranslationDto } from 'src/common/dto/translation.dto';

export class ContactInfoDto {
  @IsDefined({
    message: 'address in contact_info should not be null or undefined',
  })
  @ValidateNested({
    message: 'address in contact_info must contain both en and ar translations',
  })
  @Type(() => TranslationDto)
  address!: TranslationDto;

  @IsDefined({
    message: 'phone in contact_info should not be null or undefined',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsDefined({
    message: 'email in contact_info should not be null or undefined',
  })
  @IsString()
  @IsNotEmpty()
  email!: string;
}
