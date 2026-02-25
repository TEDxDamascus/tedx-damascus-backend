import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { CONFIG_KEYS } from '../common/config';

describe('StorageController', () => {
  let controller: StorageController;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        [CONFIG_KEYS.SUPABASE_PROJECT_URL]: 'https://test.supabase.co',
        [CONFIG_KEYS.SUPABASE_ANON_KEY]: 'test-anon-key',
        [CONFIG_KEYS.SUPABASE_STORAGE_NAME]: 'test-bucket',
      };
      return values[key];
    }),
  };

  const mockStorageService = {
    uploadImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        { provide: StorageService, useValue: mockStorageService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
