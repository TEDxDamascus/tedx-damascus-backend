import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import type { ConfigType } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { Media, MediaSchema } from './entities/media.entity';
import { appConfig } from '../common/config/app.config';
import { STORAGE_PROVIDER } from './providers/storage-provider.token';
import { StorageProvider } from './providers/storage-provider.interface';
import { SupabaseStorageProvider } from './providers/supabase-storage.provider';
import { MinioStorageProvider } from './providers/minio-storage.provider';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
  ],
  controllers: [StorageController],
  providers: [
    StorageService,
    SupabaseStorageProvider,
    MinioStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [appConfig.KEY, SupabaseStorageProvider, MinioStorageProvider],
      useFactory: (
        config: ConfigType<typeof appConfig>,
        supabase: SupabaseStorageProvider,
        minio: MinioStorageProvider,
      ): StorageProvider => {
        return config.storageDriver === 'minio' ? minio : supabase;
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
