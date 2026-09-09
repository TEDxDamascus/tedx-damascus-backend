import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import {
  UserPermission,
  UserRole,
} from '../users/entities/user.entity';

@ApiTags('Blogs') 
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  // Create Blog
  @ApiOperation({ summary: 'Create new Blog' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOGS_CREATE)
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogsService.create(createBlogDto);
  }

  // Get All Blogs
  @ApiOperation({ summary: 'Get All Blogs' })
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOGS_READ)
  findAll(@Query() query: any) {
    return this.blogsService.findAll(query);
  }

  // Get Admin Users Available As Authors
  @ApiOperation({ summary: 'Get admin users available as blog authors' })
  @Get('author-options')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOGS_READ)
  getAuthorOptions() {
    return this.blogsService.getAuthorOptions();
  }

  // Get Blog By ID
  @ApiOperation({ summary: 'Get Blog By Id' })
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOGS_READ)
  findOne(@Param('id') id: string) {
    return this.blogsService.findOne(id);
  }

  // Update Blog
  @ApiOperation({ summary: 'Update Existing Blog By Id' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOGS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    return this.blogsService.update(id, updateBlogDto);
  }

  // Delete Blog
  @ApiOperation({ summary: 'Delete Existing Blog By Id' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOGS_DELETE)
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}