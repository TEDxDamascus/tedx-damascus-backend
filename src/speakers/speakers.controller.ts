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
import { ParseIdPipe } from 'src/common/pipes/parse-id.pipe';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('Speakers')
@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  //! Create New Speaker
  @ApiOperation({ summary: 'Create new Speaker' })
  @Post()
  create(@Body() createSpeakerDto: CreateSpeakerDto) {
    return this.speakersService.create(createSpeakerDto);
  }

  //! Get All Speakers
  @ApiOperation({ summary: 'Get All Speakers' })
  @Get()
  findAll(@I18n() i18n: I18nContext) {
    return this.speakersService.findAll(i18n.lang);
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
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.speakersService.remove(id);
  }
}
