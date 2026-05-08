import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import type { ConfigType } from '@nestjs/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SpeakersModule } from './speakers/speakers.module';
import { BlogsModule } from './blogs/blogs.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { appConfig } from './common/config/app.config';
import { FormsModule } from './forms/forms.module';
import { EmailsModule } from './emails/emails.module';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { PartnersModule } from './partners/partners.module';
import * as path from 'path';
import { TeamModule } from './team/team.module';
import { OrganizerModule } from './organizer/organizer.module';
import { BlogReferencesModule } from './blog-references/blog-references.module';
import { CategoriesModule } from './categories/categories.module';
import { HomeSettingsModule } from './home-settings/home-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      cache: true,
    }),
    MongooseModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => ({
        uri: config.mongodbUri,
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    AuthModule,
    UsersModule,
    EventsModule,
    SpeakersModule,
    BlogsModule,
    StorageModule,
    FormsModule,
    PartnersModule,
    TeamModule,
    OrganizerModule,
    BlogReferencesModule,
    CategoriesModule,
    HomeSettingsModule,
    EmailsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
