import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { CONFIG_KEYS } from '../common/config';

describe('StorageService', () => {
  let service: StorageService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
