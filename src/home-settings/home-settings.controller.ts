import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { HomeSettingsService } from './home-settings.service';
import { CreateHomeSettingsDto } from './dto/create-home-settings.dto';
import { UpdateHomeSettingsDto } from './dto/update-home-settings.dto';

@Controller('homesettings')
export class HomeSettingsController {
  constructor(private readonly homeSettingsService: HomeSettingsService) {}

  @Post()
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
  update(
    @Param('id') id: string,
    @Body() updateHomeSettingsDto: UpdateHomeSettingsDto,
  ) {
    return this.homeSettingsService.update(id, updateHomeSettingsDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.homeSettingsService.remove(id);
  }
}
