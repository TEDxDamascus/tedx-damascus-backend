import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailsModule } from '../emails/emails.module';
import {
  NewsletterSubscriber,
  NewsletterSubscriberSchema,
} from './entities/newsletter-subscriber.entity';
import { Newsletter, NewsletterSchema } from './entities/newsletter.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { NewslettersController } from './newsletters.controller';
import { NewsletterUnsubscribePageRenderer } from './newsletter-unsubscribe-page.renderer';
import { NewsletterService } from './newsletters.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema },
      { name: Newsletter.name, schema: NewsletterSchema },
    ]),
    EmailsModule,
  ],
  controllers: [NewslettersController],
  providers: [
    NewsletterService,
    NewsletterUnsubscribePageRenderer,
    PermissionsGuard,
  ],
  exports: [NewsletterService],
})
export class NewslettersModule {}
