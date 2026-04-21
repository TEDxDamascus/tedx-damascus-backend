import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { I18n, I18nContext } from 'nestjs-i18n';

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
  findAll(@I18n() i18n: I18nContext) {
    return this.teamService.findAll(i18n.lang);
  }

  //! Get Team Member By Id  With Translations
  @Get(':id')
  findOne(@I18n() i18n: I18nContext, @Param('id') id: string) {
    return this.teamService.findOne(id,i18n.lang);
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
