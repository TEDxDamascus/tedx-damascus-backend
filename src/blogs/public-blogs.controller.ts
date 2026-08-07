import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BlogsService } from './blogs.service';

@Public()
@ApiTags('Public Blogs')
@Controller('public/blogs')
export class PublicBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @ApiOperation({ summary: 'Get Published Blogs For Website' })
  @Get()
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.blogsService.findPublishedAll(query);
  }

  @ApiOperation({ summary: 'Get available blog content font options' })
  @Get('fonts')
  getFontOptions() {
    return this.blogsService.getFontOptions();
  }

  @ApiOperation({ summary: 'Get Published Blog By ID Or Slug For Website' })
  @Get(':identifier')
  findOne(
    @Param('identifier') identifier: string,
    @Query('language') language?: string,
    @Query('lang') lang?: string,
  ) {
    return this.blogsService.findPublishedOne(identifier, language || lang);
  }
}
