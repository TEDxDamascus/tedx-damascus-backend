import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreatePartnerDto {
  @IsDefined()
  @IsString()
  name!: string;
  //! image
  @IsDefined()
  @IsString()
  image!: string;
  //! Slug
  @IsDefined()
  @IsString()
  slug!: string;
  //! partnership Type
  @IsDefined()
  @IsString()
  partnership_type!: string;
  //! description
  @IsDefined()
  @IsString()
  description!: string;
  //! social links
  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  social_links!: string[];
}
