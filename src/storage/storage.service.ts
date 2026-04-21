import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { appConfig } from '../common/config/app.config';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { PaginatedResult } from '../common/pagination/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../common/pagination/utils/pagination.util';
import { UploadImageResultDto } from './dto/upload-image-result.dto';
import { Media, MediaDocument } from './entities/media.entity';
import { getBasename, getDisplayName } from './utils/filename.util';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @InjectModel(Media.name)
    private readonly mediaModel: Model<MediaDocument>,
  ) {
    const url = this.config.supabaseProjectUrl;
    const key = this.config.supabaseAnonKey;
    const bucket = this.config.supabaseStorageName;

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

    const mime = file.mimetype || 'application/octet-stream';
    const basename = getBasename(file.originalname || safeName);

    const media = await this.mediaModel.create({
      basename,
      url: urlData.publicUrl,
      format: mime,
      size: bytes,
      is_active: true,
    });

    this.logger.log(
      `Media persisted id=${media.id} basename=${media.basename} size=${media.size}B format=${media.format}`,
    );

    return {
      id: media.id,
      basename: media.basename,
      name: getDisplayName(media.basename, media.format),
      url: media.url,
      createdAt: media.createdAt,
      format: media.format,
      size: media.size,
      sizeInMb,
    };
  }

  async updateMediaBasename(id: string, basename: string): Promise<Media> {
    const media = await this.mediaModel
      .findOneAndUpdate(
        { _id: id, is_active: true },
        { basename },
        { new: true },
      )
      .exec();

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async deleteMedia(id: string): Promise<void> {
    const result = await this.mediaModel
      .findOneAndUpdate({ _id: id, is_active: true }, { is_active: false })
      .exec();

    if (!result) {
      throw new NotFoundException('Media not found');
    }

    this.logger.log(`Media soft-deleted id=${id}`);
  }

  async listMedia(
    pagination: OffsetPaginationDto,
  ): Promise<PaginatedResult<Media>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const filter = { is_active: true };

    const [items, total] = await Promise.all([
      this.mediaModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(limit)
        .exec(),
      this.mediaModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  // yahiea added this for the image existing validator method
  async findOneById(id: string) {
    return await this.mediaModel.findById(id).exec();
  }

  async findOneByURL(url: string) {
    const media = await this.mediaModel.findOne({ url: url }).exec();
    if (!media) {
      throw new NotFoundException(`Media with ${url} not found`);
    }
    return media;
  }
}
