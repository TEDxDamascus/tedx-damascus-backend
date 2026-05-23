import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { FormsService } from './forms.service';
import { FormTemplate } from './entities/form-template.schema';
import { FormSubmission } from './entities/form-submission.schema';
import { StorageService } from '../storage/storage.service';

const mockFormTemplateModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  exec: jest.fn(),
};

const mockFormSubmissionModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  exec: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) =>
    key === 'app.publicSiteUrl' ? 'https://tedx.example.com' : undefined,
  ),
};

const mockStorageService = {
  uploadFormUserFile: jest.fn(),
};

describe('FormsService', () => {
  let service: FormsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'app.publicSiteUrl' ? 'https://tedx.example.com' : undefined,
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        {
          provide: getModelToken(FormTemplate.name),
          useValue: mockFormTemplateModel,
        },
        {
          provide: getModelToken(FormSubmission.name),
          useValue: mockFormSubmissionModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use ConfigService for public site URL', () => {
    expect(mockConfigService.get).toBeDefined();
  });

  describe('findOneForAdmin', () => {
    it('should return mapped admin detail with slug, shareable_url, and questions', async () => {
      const questionId = new Types.ObjectId();
      const doc = {
        _id: new Types.ObjectId(),
        name: { en: 'Test', ar: 'اختبار' },
        targetRole: 'Speaker',
        status: 'Draft',
        slug: { en: 'test-form', ar: '' },
        shareable_url: {
          en: 'https://tedx.example.com/apply/test-form',
          ar: '',
        },
        questions: [
          {
            _id: questionId,
            orderIndex: 0,
            type: 'short_text',
            title: { en: 'Name', ar: '' },
            isRequired: true,
            config: {},
            options: [],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFormTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      const result = await service.findOneForAdmin(doc._id.toString());
      expect(result.id).toBe(doc._id.toString());
      expect(result.slug).toEqual({ en: 'test-form', ar: '' });
      expect(result.shareable_url).toEqual({
        en: 'https://tedx.example.com/apply/test-form',
        ar: '',
      });
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe(questionId.toString());
      expect(result.questions[0].parentId).toBeNull();
    });
  });
});
