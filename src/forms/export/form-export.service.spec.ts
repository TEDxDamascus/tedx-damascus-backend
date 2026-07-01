import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FormExportService } from './form-export.service';
import { FormTemplate } from '../entities/form-template.schema';
import { FormSubmission } from '../entities/form-submission.schema';

const mockPdfBuffer = Buffer.from('pdf-content');

jest.mock('puppeteer', () => {
  const pdfBytes = Buffer.from('pdf-content');
  return {
    __esModule: true,
    default: {
      launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          setContent: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(new Uint8Array(pdfBytes)),
          close: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      }),
    },
  };
});

const formId = new Types.ObjectId();
const submissionId = new Types.ObjectId();
const userId = new Types.ObjectId();
const questionId = new Types.ObjectId();

const mockFormTemplateModel = {
  findById: jest.fn(),
};

const mockFormSubmissionModel = {
  findOne: jest.fn(),
};

describe('FormExportService', () => {
  let service: FormExportService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormExportService,
        {
          provide: getModelToken(FormTemplate.name),
          useValue: mockFormTemplateModel,
        },
        {
          provide: getModelToken(FormSubmission.name),
          useValue: mockFormSubmissionModel,
        },
      ],
    }).compile();

    service = module.get<FormExportService>(FormExportService);
  });

  afterEach(async () => {
    if (service) {
      await service.onModuleDestroy();
    }
  });

  it('exports submitted answers as PDF buffer', async () => {
    mockFormTemplateModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: formId,
        name: { en: 'Speaker Form', ar: 'نموذج' },
        questions: [
          {
            _id: questionId,
            orderIndex: 0,
            type: 'short_text',
            title: { en: 'Name', ar: 'الاسم' },
            isRequired: true,
            config: {},
            options: [],
          },
        ],
      }),
    });

    mockFormSubmissionModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: submissionId,
        userId,
        status: 'submitted',
        answers: [{ questionId, value: 'Jane Doe' }],
      }),
    });

    const buffer = await service.exportSubmissionPdf(formId.toString(), {
      submissionId: submissionId.toString(),
      questionIds: [questionId.toString()],
      locale: 'en',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.toString()).toBe('pdf-content');
    expect(mockFormSubmissionModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: submissionId,
        formTemplateId: {
          $in: [formId, formId.toString()],
        },
        $or: [{ status: 'submitted' }, { status: { $exists: false } }],
      }),
    );
  });

  it('throws NotFoundException when no submitted record exists', async () => {
    mockFormTemplateModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: formId,
        name: { en: 'Form', ar: 'نموذج' },
        questions: [],
      }),
    });

    mockFormSubmissionModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.exportSubmissionPdf(formId.toString(), {
        submissionId: submissionId.toString(),
        questionIds: [questionId.toString()],
        locale: 'en',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when form is missing', async () => {
    mockFormTemplateModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.exportSubmissionPdf(formId.toString(), {
        submissionId: submissionId.toString(),
        questionIds: [questionId.toString()],
        locale: 'ar',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
