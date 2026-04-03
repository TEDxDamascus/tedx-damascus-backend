import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './schema/event.schema';
import { Media, MediaSchema } from '../storage/entities/media.entity';
import { SpeakersModule } from '../speakers/speakers.module';
import { IsExistingSpeakerConstrain } from '../common/decorators/is-existing-speaker.decorator';
import { StorageModule } from '../storage/storage.module';
import { IsExistingMediaConstrain } from '../common/decorators/is-existing-media.decorator';

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
    SpeakersModule,
    StorageModule,
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    IsExistingSpeakerConstrain,
    IsExistingMediaConstrain,
  ],
})
export class EventsModule {}
