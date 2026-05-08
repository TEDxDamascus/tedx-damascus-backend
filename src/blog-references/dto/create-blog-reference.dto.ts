import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateBlogReferenceDto {
  @IsMongoId()
  blog_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsString()
  url: string;
}
