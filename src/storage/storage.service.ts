import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { PaginatedResult } from '../common/pagination/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../common/pagination/utils/pagination.util';
import { UploadImageResultDto } from './dto/upload-image-result.dto';
import { Media, MediaDocument } from './entities/media.entity';
import type { StorageProvider } from './providers/storage-provider.interface';
import { STORAGE_PROVIDER } from './providers/storage-provider.token';
import { getBasename, getDisplayName } from './utils/filename.util';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    @InjectModel(Media.name)
    private readonly mediaModel: Model<MediaDocument>,
  ) {}

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
      `Uploading via driver=${this.storageProvider.driver} path=${path} size=${file.size} mimetype=${file.mimetype}`,
    );

    try {
      await this.storageProvider.upload_object({
        key: path,
        body: file.buffer,
        content_type: file.mimetype || 'application/octet-stream',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Storage upload failed: ${message}`);
      this.logger.error(
        `Context: driver=${this.storageProvider.driver} path=${path} details=${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(`Storage upload failed: ${message}`);
    }

    const publicUrl = this.storageProvider.get_public_url(path);

    this.logger.log(
      `Upload succeeded path=${path} url=${publicUrl}`,
    );

    const bytes = file.size ?? 0;
    const sizeInMb = Math.round((bytes / (1024 * 1024)) * 100) / 100;

    const mime = file.mimetype || 'application/octet-stream';
    const basename = getBasename(file.originalname || safeName);

    const media = await this.mediaModel.create({
      basename,
      url: publicUrl,
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
}
