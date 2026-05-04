import {
  Controller,
  Body,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MaxFileSizeValidator } from '@nestjs/common/pipes';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Query } from '@nestjs/common/decorators';
import { StorageService } from './storage.service';
import { UploadFileResultDto } from './dto/upload-file-result.dto';
import { UpdateMediaBasenameDto } from './dto/update-media-name.dto';
import { MediaDto } from './dto/media.dto';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { PaginatedResult } from '../common/pagination/interfaces/paginated-result.interface';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded', type: UploadFileResultDto })
  @ApiResponse({ status: 400, description: 'Invalid or missing file' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_SIZE_BYTES })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadFileResultDto> {
    return this.storageService.uploadFile(file);
  }

  @Post('media/:id')
  @ApiOkResponse({
    description: 'Media basename updated (format is unchanged)',
    type: MediaDto,
  })
  async updateMediaBasename(
    @Param('id') id: string,
    @Body() dto: UpdateMediaBasenameDto,
  ): Promise<MediaDto> {
    const media = await this.storageService.updateMediaBasename(id, dto.basename);
    return MediaDto.fromEntity(media);
  }

  @Delete('media/:id')
  @ApiOkResponse({ description: 'Media soft-deleted (is_active set to false)' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async deleteMedia(@Param('id') id: string): Promise<void> {
    await this.storageService.deleteMedia(id);
  }

  @Get('media')
  @ApiOkResponse({
    description: 'Paginated media list (active items only)',
  })
  async listMedia(
    @Query() pagination: OffsetPaginationDto,
  ): Promise<PaginatedResult<MediaDto>> {
    const result = await this.storageService.listMedia(pagination);
    return {
      ...result,
      items: result.items.map((media) => MediaDto.fromEntity(media)),
    };
  }
}
