import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import {
  BlogPermissionQueryDto,
  CreateBlogPermissionDto,
  UpdateBlogPermissionDto,
} from './dto/blog-permission.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserPermission, UserRole } from '../users/entities/user.entity';
@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @ApiOperation({ summary: 'Create new Blog' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogsService.create(createBlogDto);
  }

  @ApiOperation({ summary: 'Get All Blogs' })
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  findAll(
    @Query() query: any,
    @Req() req: { user: { id: string; email?: string; role: string } },
  ) {
    return this.blogsService.findAll(query, req.user);
  }

  @ApiOperation({ summary: 'Super Admin: Create Blog permission for admin' })
  @Post('permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  createBlogPermission(@Body() dto: CreateBlogPermissionDto) {
    return this.blogsService.createBlogPermission(dto);
  }

  @ApiOperation({ summary: 'Super Admin: List Blog permissions' })
  @Get('permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  listBlogPermissions(@Query() query: BlogPermissionQueryDto) {
    return this.blogsService.listBlogPermissions(query);
  }

  @ApiOperation({ summary: 'Super Admin: Update Blog permission' })
  @Patch('permissions/:permissionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  updateBlogPermission(
    @Param('permissionId') permissionId: string,
    @Body() dto: UpdateBlogPermissionDto,
  ) {
    return this.blogsService.updateBlogPermission(permissionId, dto);
  }

  @ApiOperation({ summary: 'Super Admin: Delete Blog permission' })
  @Delete('permissions/:permissionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  removeBlogPermission(@Param('permissionId') permissionId: string) {
    return this.blogsService.removeBlogPermission(permissionId);
  }

  @ApiOperation({ summary: 'Get admin users available as blog authors' })
  @Get('author-options')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  getAuthorOptions() {
    return this.blogsService.getAuthorOptions();
  }

  @ApiOperation({ summary: 'Get Blog By Id' })
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  findOne(
    @Param('id') id: string,
    @Req() req: { user: { id: string; email?: string; role: string } },
  ) {
    return this.blogsService.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Update Existing Blog By Id' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOGS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Req() req: { user: { id: string; email?: string; role: string } },
  ) {
    return this.blogsService.update(id, updateBlogDto, req.user);
  }

  @ApiOperation({ summary: 'Delete Existing Blog By Id' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOGS_DELETE)
  remove(
    @Param('id') id: string,
    @Req() req: { user: { id: string; email?: string; role: string } },
  ) {
    return this.blogsService.remove(id, req.user);
  }
}
