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
import { BlogReferencesService } from './blog-references.service';
import { CreateBlogReferenceDto } from './dto/create-blog-reference.dto';
import { UpdateBlogReferenceDto } from './dto/update-blog-reference.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserPermission, UserRole } from '../users/entities/user.entity';

@Controller('blog-references')
export class BlogReferencesController {
  constructor(private readonly blogReferencesService: BlogReferencesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOG_REFERENCES_CREATE)
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOG_REFERENCES_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateBlogReferenceDto: UpdateBlogReferenceDto,
  ) {
    return this.blogReferencesService.update(id, updateBlogReferenceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.BLOG_REFERENCES_DELETE)
  remove(@Param('id') id: string) {
    return this.blogReferencesService.remove(id);
  }
}
