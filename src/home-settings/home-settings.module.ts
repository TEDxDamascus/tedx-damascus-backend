import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeSettingsController } from './home-settings.controller';
import { HomeSettingsService } from './home-settings.service';
import { HomeSettings, HomeSettingsSchema } from './entities/home-settings.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HomeSettings.name, schema: HomeSettingsSchema },
    ]),
  ],
  controllers: [HomeSettingsController],
  providers: [HomeSettingsService],
})
export class HomeSettingsModule {}
