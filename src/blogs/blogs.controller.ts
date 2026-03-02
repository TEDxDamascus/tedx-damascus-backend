import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @ApiOperation({ summary: 'Create new Blog' })
  @Post()
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogsService.create(createBlogDto);
  }

  @ApiOperation({ summary: 'Get All Blogs' })
  @Get()
  findAll() {
    return this.blogsService.findAll();
  }

  @ApiOperation({ summary: 'Get Blog By Id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update Existing Blog By Id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogsService.update(+id, updateBlogDto);
  }

  @ApiOperation({ summary: 'Delete Existing Blog By Id' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogsService.remove(+id);
  }
}
