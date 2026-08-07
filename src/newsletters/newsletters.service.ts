import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import { isValidObjectId, Model, Types } from 'mongoose';
import { appConfig } from '../common/config/app.config';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { EmailsService } from '../emails/emails.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { Newsletter } from './entities/newsletter.entity';
import { NewsletterStatus } from './enums/newsletter-status.enum';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectModel(NewsletterSubscriber.name)
    private readonly subscriberModel: Model<NewsletterSubscriber>,
    @InjectModel(Newsletter.name)
    private readonly newsletterModel: Model<Newsletter>,
    private readonly emailsService: EmailsService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.subscriberModel.findOne({ email }).exec();

    if (existing) {
      const wasActive = existing.isActive;
      existing.isActive = true;
      await existing.save();
      return {
        message: wasActive ? 'Already subscribed' : 'Subscription reactivated',
        email,
      };
    }

    try {
      const created = await this.subscriberModel.create({
        email,
        isActive: true,
      });
      return { message: 'Subscribed successfully', email: created.email };
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        await this.subscriberModel
          .updateOne({ email }, { isActive: true })
          .exec();
        return { message: 'Already subscribed', email };
      }
      throw error;
    }
  }

  async updateOwnSubscription(email: string, isActive: boolean) {
    const normalizedEmail = this.normalizeEmail(email);
    const subscriber = await this.subscriberModel
      .findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { email: normalizedEmail, isActive } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    return {
      message: isActive
        ? 'Subscribed successfully'
        : 'Unsubscribed successfully',
      email: subscriber.email,
      isActive: subscriber.isActive,
    };
  }

  async validateUnsubscribeToken(token: string) {
    const { email } = this.verifyUnsubscribeToken(token);
    return { email };
  }

  async unsubscribeByToken(token: string) {
    const { email } = this.verifyUnsubscribeToken(token);
    return this.updateOwnSubscription(email, false);
  }

  async getSubscribers(pagination: OffsetPaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const filter = { isActive: true };
    const [items, total] = await Promise.all([
      this.subscriberModel
        .find(filter)
        .select('email createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(limit)
        .lean()
        .exec(),
      this.subscriberModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createNewsletter(dto: CreateNewsletterDto, userId: string) {
    return this.newsletterModel.create({
      ...dto,
      content: this.sanitizeNewsletterHtml(dto.content),
      createdBy: new Types.ObjectId(userId),
      status: NewsletterStatus.DRAFT,
    });
  }

  async getNewsletters(pagination: OffsetPaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [items, total] = await Promise.all([
      this.newsletterModel
        .find()
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(limit)
        .lean()
        .exec(),
      this.newsletterModel.countDocuments().exec(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getNewsletter(id: string) {
    this.ensureValidNewsletterId(id);
    const newsletter = await this.newsletterModel.findById(id).lean().exec();
    if (!newsletter) throw new NotFoundException('Newsletter not found');
    return newsletter;
  }

  async updateNewsletter(id: string, dto: UpdateNewsletterDto) {
    this.ensureValidNewsletterId(id);
    const update = dto.content
      ? { ...dto, content: this.sanitizeNewsletterHtml(dto.content) }
      : dto;
    const newsletter = await this.newsletterModel
      .findOneAndUpdate({ _id: id, status: NewsletterStatus.DRAFT }, update, {
        new: true,
      })
      .exec();
    if (!newsletter) {
      throw new ConflictException('Only draft newsletters can be updated');
    }
    return newsletter;
  }

  async sendNewsletter(id: string, senderId: string) {
    this.ensureValidNewsletterId(id);
    const existingNewsletter = await this.newsletterModel
      .findById(id)
      .lean()
      .exec();

    if (!existingNewsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    const isRetry = existingNewsletter.status === NewsletterStatus.SENT;
    const recipients = isRetry
      ? this.getFailedRecipients(existingNewsletter.deliveryResults)
      : await this.getActiveSubscribers();

    if (!recipients.length) {
      if (isRetry) {
        return {
          message: 'All recipients already received this newsletter',
          sent: 0,
          failed: 0,
          deliveries: [],
          failures: [],
        };
      }

      return {
        message: 'No active subscribers found',
        sent: 0,
        failed: 0,
        deliveries: [],
        failures: [],
      };
    }

    const newsletter = await this.newsletterModel
      .findOneAndUpdate(
        {
          _id: id,
          status: { $in: [NewsletterStatus.DRAFT, NewsletterStatus.SENT] },
        },
        { status: NewsletterStatus.SENDING },
        { new: true },
      )
      .exec();

    if (!newsletter) {
      throw new ConflictException('Newsletter is already being sent');
    }

    try {
      const unsubscribeUrls = Object.fromEntries(
        recipients.map((email) => [email, this.buildUnsubscribeUrl(email)]),
      );
      const result = await this.emailsService.sendBulk({
        emails: recipients,
        subject: newsletter.subject,
        htmlMessage: newsletter.content,
        unsubscribeUrls,
      });

      const updatedResults = this.mergeDeliveryResults(
        existingNewsletter.deliveryResults || [],
        result.deliveries || [],
        result.failures || [],
      );

      const sentCount = updatedResults.filter(
        (item) => item.status === 'sent',
      ).length;
      const failedCount = updatedResults.filter(
        (item) => item.status === 'failed',
      ).length;

      await this.newsletterModel.updateOne(
        { _id: newsletter._id },
        {
          $set: {
            status: NewsletterStatus.SENT,
            sentBy: new Types.ObjectId(senderId),
            sentAt: new Date(),
            sentCount: sentCount,
            failedCount: failedCount,
            deliveryResults: updatedResults,
          },
        },
      );

      this.logger.log(
        `Newsletter ${newsletter.id} sent to ${sentCount} subscribers`,
      );
      return {
        ...result,
        message:
          failedCount === 0
            ? 'All recipients received this newsletter'
            : 'Retry completed for failed recipients',
        sent: sentCount,
        failed: failedCount,
      };
    } catch (error) {
      await this.newsletterModel.updateOne(
        { _id: newsletter._id },
        { $set: { status: existingNewsletter.status } },
      );
      throw error;
    }
  }

  private async getActiveSubscribers() {
    const subscribers = await this.subscriberModel
      .find({ isActive: true })
      .select('email')
      .lean()
      .exec();

    return subscribers.map(({ email }) => this.normalizeEmail(email));
  }

  private getFailedRecipients(
    deliveryResults?: Array<{
      email: string;
      status: 'sent' | 'failed';
      reason?: string;
    }>,
  ) {
    return (deliveryResults || [])
      .filter((item) => item.status === 'failed')
      .map((item) => this.normalizeEmail(item.email));
  }

  private mergeDeliveryResults(
    existingResults: Array<{
      email: string;
      status: 'sent' | 'failed';
      reason?: string;
    }>,
    deliveries: Array<{ email: string; success: boolean; reason?: string }>,
    failures: Array<{ email: string; success: boolean; reason?: string }>,
  ) {
    const byEmail = new Map<
      string,
      { email: string; status: 'sent' | 'failed'; reason?: string }
    >();

    for (const item of existingResults) {
      byEmail.set(this.normalizeEmail(item.email), item);
    }

    for (const item of deliveries) {
      const normalizedEmail = this.normalizeEmail(item.email);
      byEmail.set(normalizedEmail, { email: normalizedEmail, status: 'sent' });
    }

    for (const item of failures) {
      const normalizedEmail = this.normalizeEmail(item.email);
      byEmail.set(normalizedEmail, {
        email: normalizedEmail,
        status: 'failed',
        reason: item.reason,
      });
    }

    return Array.from(byEmail.values());
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private sanitizeNewsletterHtml(content: string) {
    return content
      .replace(
        /<(script|style|iframe|object|embed|form|base|meta)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
        '',
      )
      .replace(
        /<(script|style|iframe|object|embed|form|base|meta)\b[^>]*\/?\s*>/gi,
        '',
      )
      .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(
        /\s(?:href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi,
        '',
      );
  }

  private buildUnsubscribeUrl(email: string) {
    const token = this.createUnsubscribeToken(email);
    return `${this.config.publicSiteUrl}/newsletters/unsubscribe?token=${encodeURIComponent(token)}`;
  }

  private createUnsubscribeToken(email: string) {
    const payload = Buffer.from(
      JSON.stringify({
        email,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      }),
    ).toString('base64url');
    const signature = createHmac('sha256', this.config.jwtSecret)
      .update(payload)
      .digest('base64url');
    return `${payload}.${signature}`;
  }

  private verifyUnsubscribeToken(token: string): {
    email: string;
    expiresAt: number;
  } {
    const [payload, signature] = token.split('.');
    if (!payload || !signature)
      throw new BadRequestException('Invalid unsubscribe token');
    const expectedSignature = createHmac('sha256', this.config.jwtSecret)
      .update(payload)
      .digest('base64url');
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      throw new BadRequestException('Invalid unsubscribe token');
    }
    try {
      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString(),
      ) as {
        email?: string;
        expiresAt?: number;
      };
      if (
        !decoded.email ||
        !decoded.expiresAt ||
        decoded.expiresAt < Date.now()
      ) {
        throw new BadRequestException('Expired unsubscribe token');
      }
      return {
        email: this.normalizeEmail(decoded.email),
        expiresAt: decoded.expiresAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid unsubscribe token');
    }
  }

  private ensureValidNewsletterId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid newsletter id');
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
