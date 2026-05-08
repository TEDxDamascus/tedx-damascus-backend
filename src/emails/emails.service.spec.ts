import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { appConfig } from '../common/config/app.config';
import { EmailsService } from './emails.service';

describe('EmailsService', () => {
  let service: EmailsService;

  const mockAppConfig = {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: 'smtp-user',
    smtpPass: 'smtp-pass',
    smtpFromEmail: 'no-reply@example.com',
    smtpFromName: 'TEDx Damascus',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        { provide: appConfig.KEY, useValue: mockAppConfig },
      ],
    }).compile();

    service = module.get<EmailsService>(EmailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends a message to every email in the list', async () => {
    const transporter = {
      sendMail: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
    };
    jest
      .spyOn(service as any, 'createTransporter')
      .mockReturnValue(transporter);
    const sendToRecipient = jest
      .spyOn(service as any, 'sendToRecipient')
      .mockImplementation(
        (
          _transporter,
          _config,
          email: string,
          _subject,
          _htmlMessage,
          _imageUrl,
          _image,
        ) => ({
          email,
          success: true,
        }),
      );

    const result = await service.sendBulk({
      emails: ['first@example.com', 'second@example.com'],
      subject: 'Subject',
      htmlMessage: '<p><strong>Message</strong></p>',
      imageUrl: 'https://example.com/image.jpg',
    });

    expect(sendToRecipient).toHaveBeenCalledTimes(2);
    expect(sendToRecipient).toHaveBeenNthCalledWith(
      1,
      transporter,
      expect.objectContaining({
        host: mockAppConfig.smtpHost,
        fromEmail: mockAppConfig.smtpFromEmail,
      }),
      'first@example.com',
      'Subject',
      '<p><strong>Message</strong></p>',
      'https://example.com/image.jpg',
      undefined,
    );
    expect(transporter.close).toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Bulk email processed',
      sent: 2,
      failed: 0,
      deliveries: [
        {
          email: 'first@example.com',
          success: true,
        },
        {
          email: 'second@example.com',
          success: true,
        },
      ],
      failures: [],
    });
  });

  it('continues sending when one recipient fails', async () => {
    jest.spyOn(service as any, 'createTransporter').mockReturnValue({
      sendMail: jest.fn(),
      close: jest.fn(),
    });
    jest
      .spyOn(service as any, 'sendToRecipient')
      .mockResolvedValueOnce({
        email: 'first@example.com',
        success: true,
      })
      .mockRejectedValueOnce(new Error('SMTP rejected recipient'));

    const result = await service.sendBulk({
      emails: ['first@example.com', 'failed@example.com'],
      subject: 'Subject',
      htmlMessage: '<p>Message</p>',
    });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.deliveries).toEqual([
      {
        email: 'first@example.com',
        success: true,
      },
    ]);
    expect(result.failures).toEqual([
      {
        email: 'failed@example.com',
        success: false,
      },
    ]);
  });

  it('throws BadRequestException when SMTP is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        {
          provide: appConfig.KEY,
          useValue: {
            smtpPort: 587,
            smtpSecure: false,
          },
        },
      ],
    }).compile();
    const unconfiguredService = module.get<EmailsService>(EmailsService);

    await expect(
      unconfiguredService.sendBulk({
        emails: ['first@example.com'],
        subject: 'Subject',
        htmlMessage: '<p>Message</p>',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
