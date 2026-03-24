import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Event } from './schema/event.schema';
import { Model } from 'mongoose';
import { translateFieldHelper } from '../common/utils/translate.helper';

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
  async findAll(lang: string) {
    const events = await this.eventModel
      .find()
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

    return events.map((event) => ({
      ...event,
      title: translateFieldHelper(event.title, lang),
      description: translateFieldHelper(event.description, lang),
      brief: translateFieldHelper(event.brief, lang),
      location: translateFieldHelper(event.location, lang),
      event_image: (event.event_image as any)?.url,
      gallery: (event.gallery as any[])?.map((img) => img.url) || [],
      speakers: (event.speakers as any[])?.map((speaker) => ({
        ...speaker,
        name: translateFieldHelper(speaker.name, lang),
        bio: translateFieldHelper(speaker.bio, lang),
        description: translateFieldHelper(speaker.description, lang),
        speaker_image: speaker.speaker_image.url as string,
        gallery: (speaker.gallery as any[]).map((gall) => gall.url),
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
      event_image: (event.event_image as any).url,
      gallery: (event.gallery as any[])?.map((gall) => gall.url),
      speakers: (event.speakers as any[])?.map((speaker) => ({
        name: translateFieldHelper(speaker.name, lang),
        bio: translateFieldHelper(speaker.bio, lang),
        speaker_image: speaker.speaker_image?.url || null,
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
    return {
      success: true,
      message: `Event "${event.title}" deleted successfully`,
    };
  }
}
