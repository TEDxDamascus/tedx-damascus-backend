import { Module } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Organizer, OrganizerSchema } from './schema/organizer.schema';
import { IsExistingMediaConstrain } from 'src/common/decorators/is-existing-media.decorator';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organizer.name, schema: OrganizerSchema },
    ]),
    StorageModule,
  ],
  controllers: [OrganizerController],
  providers: [OrganizerService, IsExistingMediaConstrain],
  exports:[OrganizerService]
})
export class OrganizerModule {}
