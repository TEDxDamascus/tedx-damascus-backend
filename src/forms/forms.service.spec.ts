import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { FormsService } from './forms.service';
import { FormTemplate } from './entities/form-template.schema';
import { FormSubmission } from './entities/form-submission.schema';
import { StorageService } from '../storage/storage.service';

const mockSave = jest.fn();

const mockFormTemplateModel: Record<string, jest.Mock> & {
  mockImplementation?: jest.Mock['mockImplementation'];
} = jest.fn().mockImplementation(function (
  this: Record<string, unknown>,
  dto: Record<string, unknown>,
) {
  Object.assign(this, dto);
  this._id = new Types.ObjectId();
  this.save = mockSave.mockImplementation(async () => ({ ...this, ...dto }));
}) as unknown as Record<string, jest.Mock> & {
  mockImplementation?: jest.Mock['mockImplementation'];
};

mockFormTemplateModel.find = jest.fn();
mockFormTemplateModel.findById = jest.fn();
mockFormTemplateModel.findOne = jest.fn();
mockFormTemplateModel.findByIdAndDelete = jest.fn();

const mockFormSubmissionModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  exec: jest.fn(),
};

const mockStorageService = {
  uploadFormUserFile: jest.fn(),
};

describe('FormsService', () => {
  let service: FormsService;

  beforeEach(async () => {
    jest.clearAllMocks();
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
          en: 'https://tedxdamascus.sy/forms/Speaker/2026/test-form',
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
        en: 'https://tedxdamascus.sy/forms/Speaker/2026/test-form',
        ar: '',
      });
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe(questionId.toString());
      expect(result.questions[0].parentId).toBeNull();
    });
  });

  describe('getFormSchemaBySlug', () => {
    const publishedDoc = {
      _id: new Types.ObjectId(),
      name: { en: 'Apply', ar: 'تقديم' },
      targetRole: 'Speaker',
      status: 'Published',
      slug: { en: 'speaker-2025', ar: 'speaker-ar' },
      questions: [
        {
          _id: new Types.ObjectId(),
          orderIndex: 0,
          type: 'short_text',
          title: { en: 'Name', ar: '' },
          isRequired: true,
          config: {},
          options: [],
        },
      ],
    };

    it('should return schema when slug.en matches a published form', async () => {
      mockFormTemplateModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(publishedDoc),
      });
      const result = await service.getFormSchemaBySlug('speaker-2025');
      expect(result.id).toBe(publishedDoc._id.toString());
      expect(result.questions).toHaveLength(1);
      expect(mockFormTemplateModel.findOne).toHaveBeenCalledWith({
        'slug.en': 'speaker-2025',
        status: 'Published',
      });
    });

    it('should fallback to slug.ar when slug.en does not match', async () => {
      mockFormTemplateModel.findOne
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(publishedDoc) });
      const result = await service.getFormSchemaBySlug('speaker-ar');
      expect(result.id).toBe(publishedDoc._id.toString());
      expect(mockFormTemplateModel.findOne).toHaveBeenNthCalledWith(2, {
        'slug.ar': 'speaker-ar',
        status: 'Published',
      });
    });

    it('should throw NotFoundException when no published form matches', async () => {
      mockFormTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.getFormSchemaBySlug('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for empty slug', async () => {
      await expect(service.getFormSchemaBySlug('   ')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create slug uniqueness', () => {
    const baseDto = {
      name: { en: 'New Form', ar: 'نموذج' },
      targetRole: 'Speaker' as const,
    };

    it('should reject create when slug.en already exists', async () => {
      mockFormTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      });
      await expect(
        service.create({ ...baseDto, slug: { en: 'taken-slug' } }),
      ).rejects.toThrow(ConflictException);
      expect(mockFormTemplateModel).not.toHaveBeenCalled();
    });

    it('should reject create when slug.ar already exists', async () => {
      mockFormTemplateModel.findOne
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
        });
      await expect(
        service.create({ ...baseDto, slug: { en: 'free-slug', ar: 'taken-ar' } }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create draft without slug when slug is omitted', async () => {
      mockFormTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      const result = await service.create(baseDto);
      expect(result.status).toBe('Draft');
      expect(result.slug).toBeUndefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should create with provided unique slug unchanged', async () => {
      mockFormTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      const result = await service.create({
        ...baseDto,
        slug: { en: 'unique-slug' },
      });
      expect(result.slug).toEqual({ en: 'unique-slug', ar: '' });
    });
  });

  describe('update slug uniqueness', () => {
    const formId = new Types.ObjectId();
    const otherId = new Types.ObjectId();

    const buildDraftTemplate = (overrides: Record<string, unknown> = {}) => {
      const template = {
        _id: formId,
        name: { en: 'Form', ar: '' },
        targetRole: 'Speaker',
        status: 'Draft',
        slug: { en: 'current-slug', ar: '' },
        shareable_url: { en: '', ar: '' },
        questions: [],
        save: jest.fn().mockImplementation(async function (this: Record<string, unknown>) {
          return this;
        }),
        ...overrides,
      };
      return template;
    };

    it('should reject update when slug.en is taken by another form', async () => {
      mockFormTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(buildDraftTemplate()),
      });
      mockFormTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: otherId }),
      });
      await expect(
        service.update(formId.toString(), { slug: { en: 'taken-slug' } }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow update when slug.en is unchanged on same form', async () => {
      const template = buildDraftTemplate();
      mockFormTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(template),
      });
      const result = await service.update(formId.toString(), {
        slug: { en: 'current-slug' },
      });
      expect(result.slug).toEqual({ en: 'current-slug', ar: '' });
      expect(template.save).toHaveBeenCalled();
    });

    it('should allow update to new unique slug.en', async () => {
      const template = buildDraftTemplate();
      mockFormTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(template),
      });
      mockFormTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      const result = await service.update(formId.toString(), {
        slug: { en: 'new-unique-slug' },
      });
      expect(result.slug).toEqual({ en: 'new-unique-slug', ar: '' });
      expect(template.save).toHaveBeenCalled();
    });
  });
});
