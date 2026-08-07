import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { appConfig } from '../common/config/app.config';
import { EmailsService } from '../emails/emails.service';
import { Newsletter } from './entities/newsletter.entity';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { NewsletterService } from './newsletters.service';

describe('NewsletterService', () => {
  let service: NewsletterService;
  let subscriberModel: { findOne: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterService,
        {
          provide: getModelToken(NewsletterSubscriber.name),
          useValue: { findOne: jest.fn(), create: jest.fn() },
        },
        { provide: getModelToken(Newsletter.name), useValue: {} },
        { provide: EmailsService, useValue: { sendBulk: jest.fn() } },
        {
          provide: appConfig.KEY,
          useValue: {
            publicSiteUrl: 'https://api.example.com',
            jwtSecret: 'newsletter-test-secret',
          },
        },
      ],
    }).compile();

    service = module.get(NewsletterService);
    subscriberModel = module.get(getModelToken(NewsletterSubscriber.name));
  });

  it('normalizes and creates a new subscriber', async () => {
    subscriberModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    subscriberModel.create.mockResolvedValue({ email: 'user@example.com' });

    await service.subscribe({ email: ' User@Example.COM ' });

    expect(subscriberModel.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
    expect(subscriberModel.create).toHaveBeenCalledWith({
      email: 'user@example.com',
      isActive: true,
    });
  });

  it('rejects an invalid newsletter id before querying MongoDB', async () => {
    await expect(service.getNewsletter('invalid-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('accepts a valid signed unsubscribe token', async () => {
    const token = (service as any).createUnsubscribeToken('user@example.com');

    await expect(service.validateUnsubscribeToken(token)).resolves.toEqual({
      email: 'user@example.com',
    });
  });
});
