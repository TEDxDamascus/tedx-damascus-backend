import { IsDefined, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganizerDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  name!: string;
  
  @IsDefined()
  image!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  bio!: string;

  @IsDefined()
  social_links!: string[]; //TODO make it object

  @IsDefined()
  role!: string;

  @IsDefined()
  gallery!: string[]; // this was called Memories in the old TEDx
}
