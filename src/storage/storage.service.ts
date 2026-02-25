import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { CONFIG_KEYS } from '../common/config';
import { UploadImageResultDto } from './dto/upload-image-result.dto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>(CONFIG_KEYS.SUPABASE_PROJECT_URL);
    const key = this.configService.get<string>(CONFIG_KEYS.SUPABASE_ANON_KEY);
    const bucket = this.configService.get<string>(
      CONFIG_KEYS.SUPABASE_STORAGE_NAME,
    );

    if (!url || !key || !bucket) {
      throw new Error(
        'Missing Supabase config: SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, and SUPABASE_STORAGE_NAME must be set',
      );
    }

    this.supabase = createClient(url, key);
    this.bucketName = bucket;
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadImageResultDto> {
    if (!file?.buffer && !file?.originalname) {
      this.logger.warn('uploadImage called with no file');
      throw new BadRequestException('No file provided');
    }

    const safeName = (file.originalname || 'image')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .slice(0, 100);
    const path = `images/${randomUUID()}-${safeName}`;

    this.logger.debug(
      `Uploading to bucket=${this.bucketName} path=${path} size=${file.size} mimetype=${file.mimetype}`,
    );

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      this.logger.error(`Storage upload failed: ${error.message}`);
      this.logger.error(
        `Context: bucket=${this.bucketName} path=${path} errorName=${error.name} details=${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException(
        `Storage upload failed: ${error.message}`,
      );
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    this.logger.log(
      `Upload succeeded path=${data.path} url=${urlData.publicUrl}`,
    );

    const bytes = file.size ?? 0;
    const sizeInMb = Math.round((bytes / (1024 * 1024)) * 100) / 100;

    return {
      url: urlData.publicUrl,
      originalName: file.originalname || 'unknown',
      mimetype: file.mimetype || 'application/octet-stream',
      sizeInMb,
    };
  }
}
