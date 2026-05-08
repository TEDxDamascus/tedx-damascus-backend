import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogReferenceDto } from './create-blog-reference.dto';

export class UpdateBlogReferenceDto extends PartialType(
  CreateBlogReferenceDto,
) {}
