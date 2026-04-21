import { Module } from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Speaker, SpeakerSchema } from './schemas/speaker.schema';
import { StorageModule } from 'src/storage/storage.module';
import { IsExistingMediaConstrain } from 'src/common/decorators/is-existing-media.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Speaker.name,
        schema: SpeakerSchema,
      },
    ]),
    StorageModule,
  ],
  controllers: [SpeakersController],
  providers: [SpeakersService, IsExistingMediaConstrain],
  exports: [SpeakersService],
})
export class SpeakersModule {}
