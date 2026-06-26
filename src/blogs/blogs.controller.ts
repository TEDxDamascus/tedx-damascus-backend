import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
  create(
    @Body() createBlogDto: CreateBlogDto,
    @Query('language') language?: string,
    @Query('lang') lang?: string,
  ) {
    return this.blogsService.create(createBlogDto, language || lang);
  }

  @ApiOperation({ summary: 'Get All Blogs' })
  @Get()
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.blogsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get Blog By Id' })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('language') language?: string,
    @Query('lang') lang?: string,
  ) {
    return this.blogsService.findOne(id, language || lang);
  }

  @ApiOperation({ summary: 'Update Existing Blog By Id' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Query('language') language?: string,
    @Query('lang') lang?: string,
  ) {
    return this.blogsService.update(id, updateBlogDto, language || lang);
  }

  @ApiOperation({ summary: 'Delete Existing Blog By Id' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}
