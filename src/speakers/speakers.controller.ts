import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Speakers')
@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @ApiOperation({ summary: 'Create new Speaker' })
  @Post()
  create(@Body() createSpeakerDto: CreateSpeakerDto) {
    return this.speakersService.create(createSpeakerDto);
  }

  @ApiOperation({ summary: 'Get All Speakers' })
  @Get()
  findAll() {
    return this.speakersService.findAll();
  }

  @ApiOperation({ summary: 'Get Existing Speaker By Id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.speakersService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update Existing Speaker By Id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSpeakerDto: UpdateSpeakerDto) {
    return this.speakersService.update(+id, updateSpeakerDto);
  }

  @ApiOperation({ summary: 'Delete Existing Speaker By Id' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.speakersService.remove(+id);
  }
}
