import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { Media } from './entities/media.entity';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { STORAGE_PROVIDER } from './providers/storage-provider.token';

describe('StorageService', () => {
  let service: StorageService;

  const mockStorageProvider = {
    driver: 'supabase',
    upload_object: jest.fn(),
    ensure_prefix: jest.fn(),
    get_public_url: jest.fn(),
  };

  const mockMediaModel = {
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    mockStorageProvider.upload_object.mockReset();
    mockStorageProvider.ensure_prefix.mockReset();
    mockStorageProvider.get_public_url.mockReset();
    mockMediaModel.create.mockReset();
    mockMediaModel.findOneAndUpdate.mockReset();
    mockMediaModel.find.mockReset();
    mockMediaModel.countDocuments.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
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

    mockStorageProvider.upload_object.mockResolvedValue({
      key: 'uploads/uuid-test-image.jpg',
    });

    mockStorageProvider.get_public_url.mockReturnValue(
      'https://public.url/uploads/uuid-test-image.jpg',
    );

    const mediaDoc = {
      id: 'media-id-123',
      basename: 'test-image',
      url: 'https://public.url/uploads/uuid-test-image.jpg',
      format: 'image/jpeg',
      size: file.size,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    mockMediaModel.create.mockResolvedValue(mediaDoc);

    const result = await service.uploadFile(file);

    expect(mockStorageProvider.upload_object).toHaveBeenCalled();
    expect(mockStorageProvider.get_public_url).toHaveBeenCalled();
    expect(mockMediaModel.create).toHaveBeenCalledWith({
      basename: 'test-image',
      url: 'https://public.url/uploads/uuid-test-image.jpg',
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

  it('uploadFormUserFile uploads under users/{userId}/forms/{formId}/ and does not create Media', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const formId = '507f1f77bcf86cd799439012';
    const file = {
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 512,
      buffer: Buffer.from('pdf-bytes'),
    } as Express.Multer.File;

    mockStorageProvider.upload_object.mockResolvedValue({ key: 'stub' });
    mockStorageProvider.get_public_url.mockReturnValue(
      'https://cdn.example.com/users/507f1f77bcf86cd799439011/forms/507f1f77bcf86cd799439012/uuid-document.pdf',
    );

    const result = await service.uploadFormUserFile({ userId, formId, file });

    expect(mockStorageProvider.upload_object).toHaveBeenCalledTimes(1);
    const uploadArg = mockStorageProvider.upload_object.mock.calls[0][0];
    expect(uploadArg.key).toMatch(
      new RegExp(
        `^users/${userId}/forms/${formId}/[0-9a-f-]{36}-document\\.pdf$`,
        'i',
      ),
    );
    expect(uploadArg.body).toEqual(file.buffer);
    expect(uploadArg.content_type).toBe('application/pdf');
    expect(mockMediaModel.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      url: 'https://cdn.example.com/users/507f1f77bcf86cd799439011/forms/507f1f77bcf86cd799439012/uuid-document.pdf',
    });
  });

  it('uploadFormUserFile throws BadRequestException for invalid userId', async () => {
    const file = {
      originalname: 'a.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('x'),
    } as Express.Multer.File;

    await expect(
      service.uploadFormUserFile({
        userId: 'not-an-objectid',
        formId: '507f1f77bcf86cd799439012',
        file,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockStorageProvider.upload_object).not.toHaveBeenCalled();
  });

  it('updates media basename and returns updated document', async () => {
    const mediaDoc = {
      id: 'media-id-123',
      basename: 'old-name',
      url: 'https://public.url/uploads/uuid-test-image.jpg',
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
      url: 'https://public.url/uploads/uuid-test-image.jpg',
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
      url: 'https://public.url/uploads/uuid-test-image.jpg',
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
