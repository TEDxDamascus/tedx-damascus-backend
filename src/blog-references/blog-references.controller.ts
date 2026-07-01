import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BlogReferencesService } from './blog-references.service';
import { CreateBlogReferenceDto } from './dto/create-blog-reference.dto';
import { UpdateBlogReferenceDto } from './dto/update-blog-reference.dto';

@Controller('blog-references')
export class BlogReferencesController {
  constructor(private readonly blogReferencesService: BlogReferencesService) {}

  @Post()
  create(@Body() createBlogReferenceDto: CreateBlogReferenceDto) {
    return this.blogReferencesService.create(createBlogReferenceDto);
  }

  @Get()
  findAll(@Query() query: { blog_id?: string }) {
    return this.blogReferencesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogReferencesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBlogReferenceDto: UpdateBlogReferenceDto,
  ) {
    return this.blogReferencesService.update(id, updateBlogReferenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogReferencesService.remove(id);
  }
}
