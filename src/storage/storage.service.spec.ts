import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { appConfig } from '../common/config/app.config';
import { StorageService } from './storage.service';
import { Media } from './entities/media.entity';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';

describe('StorageService', () => {
  let service: StorageService;

  const mockAppConfig = {
    mongodbUri: 'mongodb://localhost:27017/test',
    supabaseProjectUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
    supabaseStorageName: 'test-bucket',
    port: 3000,
  };

  const mockSupabaseStorage = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  const mockSupabaseClient = {
    storage: {
      from: jest.fn(() => mockSupabaseStorage),
    },
  } as any;

  const mockMediaModel = {
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  jest.mock('@supabase/supabase-js', () => ({
    createClient: () => mockSupabaseClient,
  }));

  beforeEach(async () => {
    mockSupabaseStorage.upload.mockReset();
    mockSupabaseStorage.getPublicUrl.mockReset();
    mockMediaModel.create.mockReset();
    mockMediaModel.findOneAndUpdate.mockReset();
    mockMediaModel.find.mockReset();
    mockMediaModel.countDocuments.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: appConfig.KEY, useValue: mockAppConfig },
        { provide: getModelToken(Media.name), useValue: mockMediaModel },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('persists media and returns dto on successful upload', async () => {
    const file = {
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 1024,
      buffer: Buffer.from('test'),
    } as any;

    mockSupabaseStorage.upload.mockResolvedValue({
      data: { path: 'images/uuid-test-image.jpg' },
      error: null,
    });

    mockSupabaseStorage.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://public.url/images/uuid-test-image.jpg' },
    });

    const mediaDoc = {
      id: 'media-id-123',
      basename: 'test-image',
      url: 'https://public.url/images/uuid-test-image.jpg',
      format: 'image/jpeg',
      size: file.size,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    mockMediaModel.create.mockResolvedValue(mediaDoc);

    const result = await service.uploadImage(file);

    expect(mockSupabaseStorage.upload).toHaveBeenCalled();
    expect(mockSupabaseStorage.getPublicUrl).toHaveBeenCalled();
    expect(mockMediaModel.create).toHaveBeenCalledWith({
      basename: 'test-image',
      url: 'https://public.url/images/uuid-test-image.jpg',
      format: 'image/jpeg',
      size: file.size,
      is_active: true,
    });

    expect(result).toMatchObject({
      id: mediaDoc.id,
      basename: mediaDoc.basename,
      name: 'test-image.jpg',
      url: mediaDoc.url,
      format: mediaDoc.format,
      size: mediaDoc.size,
    });
    expect(typeof result.sizeInMb).toBe('number');
  });

  it('updates media basename and returns updated document', async () => {
    const mediaDoc = {
      id: 'media-id-123',
      basename: 'old-name',
      url: 'https://public.url/images/uuid-test-image.jpg',
      format: 'image/jpeg',
      size: 1024,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    mockMediaModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ ...mediaDoc, basename: 'new-name' }),
    });

    const result = await service.updateMediaBasename(mediaDoc.id, 'new-name');

    expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mediaDoc.id, is_active: true },
      { basename: 'new-name' },
      { new: true },
    );
    expect(result.basename).toBe('new-name');
  });

  it('throws NotFoundException when updating non-existing media', async () => {
    mockMediaModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.updateMediaBasename('non-existing-id', 'basename'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft-deletes media by setting is_active to false', async () => {
    const mediaDoc = {
      id: 'media-id-123',
      basename: 'name',
      url: 'https://public.url/images/uuid-test-image.jpg',
      format: 'image/jpeg',
      size: 1024,
      is_active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    mockMediaModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mediaDoc),
    });

    await service.deleteMedia(mediaDoc.id);

    expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mediaDoc.id, is_active: true },
      { is_active: false },
    );
  });

  it('throws NotFoundException when deleting non-existing media', async () => {
    mockMediaModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.deleteMedia('non-existing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists media with pagination wrapper', async () => {
    const pagination = new OffsetPaginationDto();
    pagination.page = 2;
    pagination.limit = 5;

    const mediaDoc = {
      id: 'media-id-1',
      basename: 'name',
      url: 'https://public.url/images/uuid-test-image.jpg',
      format: 'image/jpeg',
      size: 1024,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    const findChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mediaDoc]),
    };

    mockMediaModel.find.mockReturnValue(findChain);
    mockMediaModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(12),
    });

    const result = await service.listMedia(pagination);

    expect(mockMediaModel.find).toHaveBeenCalledWith({ is_active: true });
    expect(mockMediaModel.countDocuments).toHaveBeenCalledWith({
      is_active: true,
    });
    expect(findChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(findChain.skip).toHaveBeenCalledWith(pagination.skip);
    expect(findChain.limit).toHaveBeenCalledWith(pagination.limit);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(12);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.totalPages).toBe(Math.ceil(12 / 5));
  });
});
