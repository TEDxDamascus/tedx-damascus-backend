import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  LocalizedStringArrayDto,
  LocalizedStringDto,
} from './localized-string.dto';
import { BlogFont } from '../enums/blog-font.enum';

export class CreateBlogDto {
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedStringDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  slug?: LocalizedStringDto;

  @IsOptional()
  @IsMongoId()
  blog_image?: string;

  @IsOptional()
  @IsMongoId()
  og_image?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  content: LocalizedStringDto;

  @IsOptional()
  @IsEnum(BlogFont, {
    message: `content_font must be one of: [${Object.values(BlogFont).join(', ')}]`,
  })
  @ApiProperty({ enum: BlogFont, required: false, default: BlogFont.CAIRO })
  content_font?: BlogFont;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringArrayDto)
  tags?: LocalizedStringArrayDto;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsMongoId()
  category_id?: string;

  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @IsOptional()
  @IsNumber()
  read_time?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  meta_title?: LocalizedStringDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  meta_description?: LocalizedStringDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringArrayDto)
  meta_keywords?: LocalizedStringArrayDto;

  @IsOptional()
  @IsString()
  canonical_url?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  og_title?: LocalizedStringDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  og_description?: LocalizedStringDto;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  gallery?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  related_blogs_ids?: string[];
}
