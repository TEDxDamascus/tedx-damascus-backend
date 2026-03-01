import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Event } from './schema/event.schema';
import { Model } from 'mongoose';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
  ) {}

  //! Create New Event
  create(createEventDto: CreateEventDto) {
    const newEvent = new this.eventModel(createEventDto);
    return newEvent.save();
  }
  //! Get All Events
  findAll() {
    const allEvents = this.eventModel.find().exec();
    return allEvents;
  }
  //! Get Event By Id
  async findOne(id: string) {
    const event = await this.eventModel.findById(id).exec();
    if (!event)
      throw new NotFoundException(`Event with id ${id} was not found`);
    return event;
  }
  //! Update Event By Id
  async update(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.eventModel.findByIdAndUpdate(id, updateEventDto, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} was not found`);
    }
    return event;
  }
  //! Remove Event By Id
  async remove(id: string) {
    const event = await this.eventModel.findByIdAndDelete(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} was not found`);
    }
    return {
      success: true,
      message: `Event "${event.title}" deleted successfully`,
    };
  }
}
