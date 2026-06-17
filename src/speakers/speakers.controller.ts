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
import { SpeakersService } from './speakers.service';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PaginationQueryDto } from '../events/dto/pagination.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserPermission, UserRole } from '../users/entities/user.entity';
@ApiTags('Speakers')
@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  //! Create New Speaker
  @ApiOperation({ summary: 'Create new Speaker' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.SPEAKERS_CREATE)
  create(@Body() createSpeakerDto: CreateSpeakerDto) {
    return this.speakersService.create(createSpeakerDto);
  }

  //! Get All Speakers
  @ApiOperation({ summary: 'Get All Speakers' })
  @Get()
  findAll(
    @I18n() i18n: I18nContext,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.speakersService.findAll(i18n.lang, paginationQuery);
  }

  //! Get Speaker By Id
  @ApiOperation({ summary: 'Get Existing Speaker By Id' })
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: string, @I18n() i18n: I18nContext) {
    return this.speakersService.findOne(id, i18n.lang);
  }

  //! Update Speaker By Id
  @ApiOperation({ summary: 'Update Existing Speaker By Id' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.SPEAKERS_UPDATE)
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body() updateSpeakerDto: UpdateSpeakerDto,
    @I18n() i18n: I18nContext,
  ) {
    return this.speakersService.update(id, updateSpeakerDto);
  }

  //! Delete Speaker By Id
  @ApiOperation({ summary: 'Delete Existing Speaker By Id' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.SPEAKERS_DELETE)
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.speakersService.remove(id);
  }
}
