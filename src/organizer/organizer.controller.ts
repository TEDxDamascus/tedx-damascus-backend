import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { I18n, I18nContext } from 'nestjs-i18n';

@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post()
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
  update(
    @Param('id') id: string,
    @Body() updateOrganizerDto: UpdateOrganizerDto,
  ) {
    return this.organizerService.update(id, updateOrganizerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizerService.remove(id);
  }
}
