import { Module, forwardRef } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from './schema/team.schema';
import { Media, MediaSchema } from 'src/storage/entities/media.entity';
import { IsExistingMediaConstrain } from 'src/common/decorators/is-existing-media.decorator';
import { IsExistingEventConstrain } from 'src/common/decorators/is-existing-event.decorator';
import { StorageModule } from 'src/storage/storage.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: Media.name, schema: MediaSchema },
    ]),
    StorageModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [TeamController],
  providers: [TeamService, IsExistingMediaConstrain, IsExistingEventConstrain],
  exports: [TeamService],
})
export class TeamModule {}
