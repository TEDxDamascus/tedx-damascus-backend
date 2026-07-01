import { Test, TestingModule } from '@nestjs/testing';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

describe('EmailsController', () => {
  let controller: EmailsController;

  const mockEmailsService = {
    sendBulk: jest.fn(),
  };

  beforeEach(async () => {
    mockEmailsService.sendBulk.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailsController],
      providers: [{ provide: EmailsService, useValue: mockEmailsService }],
    }).compile();

    controller = module.get<EmailsController>(EmailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates bulk sending to the emails service', async () => {
    const dto = {
      emails: ['first@example.com'],
      subject: 'Subject',
      htmlMessage: '<p>Message</p>',
    };
    const response = {
      message: 'Bulk email processed',
      sent: 1,
      failed: 0,
      failures: [],
    };

    mockEmailsService.sendBulk.mockResolvedValue(response);

    await expect(controller.sendBulk(dto)).resolves.toBe(response);
    expect(mockEmailsService.sendBulk).toHaveBeenCalledWith(dto, undefined);
  });
});
