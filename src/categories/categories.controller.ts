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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Query('language') language?: string,
    @Query('lang') lang?: string,
  ) {
    return this.categoriesService.create(createCategoryDto, language || lang);
  }

  @Get()
  findAll(@Query('language') language?: string, @Query('lang') lang?: string) {
    return this.categoriesService.findAll(language || lang);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('language') language?: string,
    @Query('lang') lang?: string,
  ) {
    return this.categoriesService.findOne(id, language || lang);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Query('language') language?: string,
    @Query('lang') lang?: string,
  ) {
    return this.categoriesService.update(
      id,
      updateCategoryDto,
      language || lang,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
