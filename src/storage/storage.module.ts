import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { Media, MediaSchema } from './entities/media.entity';
import { IsExistingMediaConstrain } from 'src/common/decorators/is-existing-media.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
  ],
  controllers: [StorageController],
  providers: [StorageService, IsExistingMediaConstrain],
  exports: [StorageService, IsExistingMediaConstrain],
})
export class StorageModule {}
