import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { FormTemplate } from './entities/form-template.schema';
import { FormSubmission } from './entities/form-submission.schema';
import { StorageService } from '../storage/storage.service';

const mockFormTemplateModel = {};
const mockFormSubmissionModel = {};
const mockConfigService = { get: jest.fn(() => 'https://example.com') };
const mockStorageService = { uploadFormUserFile: jest.fn() };

describe('FormsController', () => {
  let controller: FormsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
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

    controller = module.get<FormsController>(FormsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
