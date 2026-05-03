import { Module } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Organizer, OrganizerSchema } from './schema/organizer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organizer.name, schema: OrganizerSchema },
      // { name: Media.name, schema: MediaSchema },
    ]),
  ],
  controllers: [OrganizerController],
  providers: [OrganizerService],
})
export class OrganizerModule {}
