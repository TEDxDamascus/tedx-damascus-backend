import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPermission, UserRole } from './entities/user.entity';
import { CreateUserGuard } from './guards/create-user.guard';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions(UserPermission.USERS_CREATE)
  @UseGuards(CreateUserGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions(UserPermission.USERS_READ)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Permissions(UserPermission.USERS_READ)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions(UserPermission.USERS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user: { id: string; role: string } },
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Patch(':id/permissions')
  @Permissions(UserPermission.USERS_UPDATE)
  updatePermissions(
    @Param('id') id: string,
    @Body() updateUserPermissionsDto: UpdateUserPermissionsDto,
  ) {
    return this.usersService.updatePermissions(id, updateUserPermissionsDto);
  }

  @Patch(':id/disable')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(UserPermission.USERS_UPDATE)
  disable(
    @Param('id') id: string,
    @Req() req: { user: { id: string; role: string } },
  ) {
    return this.usersService.setActive(id, false, req.user);
  }

  @Patch(':id/enable')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(UserPermission.USERS_UPDATE)
  enable(
    @Param('id') id: string,
    @Req() req: { user: { id: string; role: string } },
  ) {
    return this.usersService.setActive(id, true, req.user);
  }

  @Delete(':id')
  @Permissions(UserPermission.USERS_DELETE)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
