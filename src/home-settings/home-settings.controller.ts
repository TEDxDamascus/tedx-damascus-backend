import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HomeSettingsService } from './home-settings.service';
import { CreateHomeSettingsDto } from './dto/create-home-settings.dto';
import { UpdateHomeSettingsDto } from './dto/update-home-settings.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserPermission, UserRole } from '../users/entities/user.entity';

@Controller('homesettings')
export class HomeSettingsController {
  constructor(private readonly homeSettingsService: HomeSettingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.HOME_SETTINGS_CREATE)
  create(@Body() createHomeSettingsDto: CreateHomeSettingsDto) {
    return this.homeSettingsService.create(createHomeSettingsDto);
  }

  @Get()
  findAll() {
    return this.homeSettingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.homeSettingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.HOME_SETTINGS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateHomeSettingsDto: UpdateHomeSettingsDto,
  ) {
    return this.homeSettingsService.update(id, updateHomeSettingsDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.HOME_SETTINGS_DELETE)
  remove(@Param('id') id: string) {
    return this.homeSettingsService.remove(id);
  }
}
