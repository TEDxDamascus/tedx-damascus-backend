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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { PaginationQueryDto } from './dto/pagination.dto';
import { EventQueryDto } from './dto/search.events.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserPermission, UserRole } from '../users/entities/user.entity';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}
  //! Create New Event
  @ApiOperation({ summary: 'Create new Event' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.EVENTS_CREATE)
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }
  //! Get ALL Events
  @ApiOperation({ summary: 'Get All Events' })
  @Get()
  async findAll(
    @I18n() i18n: I18nContext,
    @Query() paginationQuery: PaginationQueryDto,
    @Query() eventQuery: EventQueryDto,
  ) {
    return await this.eventsService.findAll(
      i18n.lang,
      paginationQuery,
      eventQuery,
    );
  }
  //! Get Event By Id
  @ApiOperation({ summary: 'Get Event By Id' })
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: string, @I18n() i18n: I18nContext) {
    return this.eventsService.findOne(id, i18n.lang);
  }
  //! Update Event
  @ApiOperation({ summary: 'Update Event' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.EVENTS_UPDATE)
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }
  //! Delete Event
  @ApiOperation({ summary: 'Delete Event' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.EVENTS_DELETE)
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.eventsService.remove(id);
  }
}
