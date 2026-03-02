import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ParseIdPipe } from './pipes/parse-id.pipe'; // custom pipe to parse the id from string to ObjectId of mongoose
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'Create new Event' })
  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @ApiOperation({ summary: 'Get All Events' })
  @Get()
  async findAll() {
    return await this.eventsService.findAll();
  }

  @ApiOperation({ summary: 'Get Event By Id' })
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update Event' })
  @Patch(':id')
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  @ApiOperation({ summary: 'Delete Event' })
  @Delete(':id')
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.eventsService.remove(id);
  }
}
