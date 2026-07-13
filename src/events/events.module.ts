import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schema/event.schema';
import { Media, MediaSchema } from '../storage/entities/media.entity';
import { SpeakersModule } from '../speakers/speakers.module';
import { TeamModule } from '../team/team.module';
import { IsExistingSpeakerConstrain } from '../common/decorators/is-existing-speaker.decorator';
import { IsExistingTeamConstrain } from '../common/decorators/is-existing-team.decorator';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Media.name, schema: MediaSchema },
    ]),
    SpeakersModule,
    TeamModule,
    StorageModule,
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    IsExistingSpeakerConstrain,
    IsExistingTeamConstrain,
  ],
})
export class EventsModule {}
