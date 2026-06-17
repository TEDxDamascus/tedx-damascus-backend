import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserPermission, UserRole } from '../users/entities/user.entity';

@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.ORGANIZER_CREATE)
  create(@Body() createOrganizerDto: CreateOrganizerDto) {
    return this.organizerService.create(createOrganizerDto);
  }

  @Get()
  findAll(@I18n() i18n: I18nContext) {
    return this.organizerService.findAll(i18n.lang);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.organizerService.findOne(id, i18n.lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.ORGANIZER_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateOrganizerDto: UpdateOrganizerDto,
  ) {
    return this.organizerService.update(id, updateOrganizerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.ORGANIZER_DELETE)
  remove(@Param('id') id: string) {
    return this.organizerService.remove(id);
  }
}
