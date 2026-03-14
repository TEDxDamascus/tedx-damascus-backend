import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './schema/event.schema';
import { Media, MediaSchema } from '../storage/entities/media.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
      },
      {
        name: Media.name,
        schema: MediaSchema,
      },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
