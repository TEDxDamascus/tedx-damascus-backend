import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Event } from './schema/event.schema';
import { Model } from 'mongoose';
import { translateFieldHelper } from '../common/utils/translate.helper';
import { PaginationQueryDto } from './dto/pagination.dto';
import { EventQueryDto } from './dto/search.events.dto';

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
  async findAll(
    lang: string,
    paginationQueryDto: PaginationQueryDto,
    eventQuery: EventQueryDto,
  ) {
    const { limit, offset } = paginationQueryDto;
    const { title, year, type } = eventQuery;

    const filters: any = {}; // remove any later
    //$ search title
    if (title) {
      const cleanTitle = title?.trim();
      const escaped = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (cleanTitle) {
        filters[`title.${lang}`] = {
          $regex: `^${escaped}`,
          $options: 'i',
        };
      } else {
        filters.$text = { $search: cleanTitle };
      }
    }
    //$ filter the types [salon,meetup,main_event]
    if (type) {
      filters.event_type = type;
    }
    //$ filter the year
    if (year) {
      //! add limit and return and not doing
      const y = Number(year);
      filters.date = {
        $gte: new Date(`${y}-01-01`),
        $lte: new Date(`${y}-12-31`),
      };
    }
    const events = await this.eventModel
      .find(filters)
      .skip(offset)
      .limit(limit)
      .populate('event_image', 'url -_id')
      .populate('gallery', 'url -_id')
      .populate({
        path: 'speakers',
        populate: [
          {
            path: 'speaker_image',
            select: 'url -_id',
          },
          {
            path: 'gallery',
            select: 'url -_id',
          },
        ],
      })
      .lean()
      .exec();
    //! remove gallery of the speaker
    return events.map((event) => ({
      ...event,
      title: translateFieldHelper(event.title, lang),
      description: translateFieldHelper(event.description, lang),
      brief: translateFieldHelper(event.brief, lang),
      location: translateFieldHelper(event.location, lang),
      event_image: event.event_image.url,
      gallery: event.gallery.map((img) => img.url),
      speakers: event.speakers.map((speaker) => ({
        name: translateFieldHelper(speaker.name, lang),
        bio: translateFieldHelper(speaker.bio, lang),
        description: translateFieldHelper(speaker.description, lang),
        speaker_image: speaker.speaker_image.url,
      })),
    }));
  }
  //! Get Event By Id
  async findOne(id: string, lang: string) {
    const event = await this.eventModel
      .findById(id)
      .populate('event_image', 'url -_id')
      .populate('gallery', 'url -_id')
      .populate({
        path: 'speakers',
        populate: [
          {
            path: 'speaker_image',
            select: 'url -_id',
          },
        ],
      })
      .lean()
      .exec();
    if (!event)
      throw new NotFoundException(`Event with id ${id} was not found`);
    return {
      ...event,
      title: translateFieldHelper(event.title, lang),
      description: translateFieldHelper(event.description, lang),
      brief: event.brief ? translateFieldHelper(event.brief, lang) : undefined,
      location: translateFieldHelper(event.location, lang),
      event_image: event.event_image.url,
      gallery: event.gallery.map((gall) => gall.url),
      speakers: event.speakers.map((speaker) => ({
        name: translateFieldHelper(speaker.name, lang),
        bio: translateFieldHelper(speaker.bio, lang),
        speaker_image: speaker.speaker_image.url,
      })),
    };
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
  }
}
