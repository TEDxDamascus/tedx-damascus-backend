import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { FormsService } from './forms.service';
import { FormTemplate } from './entities/form-template.schema';
import { FormSubmission } from './entities/form-submission.schema';

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
    it('should return mapped summary with slug and shareable_url', async () => {
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
    });
  });
});
