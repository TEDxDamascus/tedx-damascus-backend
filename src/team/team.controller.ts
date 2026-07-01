import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PaginationQueryDto } from 'src/events/dto/pagination.dto';
import { TeamQueryDto } from './dto/search-team.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  //! create new Team Member
  @Post()
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamService.create(createTeamDto);
  }

  //! Get All Members with Translations
  @Get()
  findAll(
    @I18n() i18n: I18nContext,
    @Query() paginationQuery: PaginationQueryDto,
    @Query() teamQueryDto: TeamQueryDto,
  ) {
    return this.teamService.findAll(i18n.lang, paginationQuery, teamQueryDto);
  }

  //! Get Team Member By Id  With Translations
  @Get(':id')
  findOne(@I18n() i18n: I18nContext, @Param('id') id: string) {
    return this.teamService.findOne(id, i18n.lang);
  }

  //! Update Team Member
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamService.update(id, updateTeamDto);
  }

  //! Get All Members
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
