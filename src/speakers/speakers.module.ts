import { Module } from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Speaker, SpeakerSchema } from './schemas/speaker.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Speaker.name,
        schema: SpeakerSchema,
      },
    ]),
  ],
  controllers: [SpeakersController],
  providers: [SpeakersService],
  exports:[SpeakersService]
})
export class SpeakersModule {}
