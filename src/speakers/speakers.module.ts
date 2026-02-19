import { Module } from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';

@Module({
  controllers: [SpeakersController],
  providers: [SpeakersService],
})
export class SpeakersModule {}
