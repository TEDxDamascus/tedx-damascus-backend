import { IsOptional, IsString } from 'class-validator';

export class PartnerQueryDto {
  //! searching with name
  @IsOptional()
  @IsString()
  name?: string;
}
