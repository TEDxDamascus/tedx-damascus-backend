import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

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
  social_links!: string[];

  @IsDefined()
  role!: string; //TODO make it enum (organizer or co-organizer)

  @IsDefined()
  gallery!: string[]; // this was called Memories in the old TEDx
}
