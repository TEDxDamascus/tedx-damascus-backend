import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserPermission, UserRole } from '../users/entities/user.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.CATEGORIES_CREATE)
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.CATEGORIES_UPDATE)
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.CATEGORIES_DELETE)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
