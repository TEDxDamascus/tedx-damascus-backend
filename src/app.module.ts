import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SpeakersModule } from './speakers/speakers.module';
import { BlogsModule } from './blogs/blogs.module';
import { BlogReferencesModule } from './blog-references/blog-references.module';
import { CategoriesModule } from './categories/categories.module';
import { HomeSettingsModule } from './home-settings/home-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tedx-damascus',
    ),
    AuthModule,
    EventsModule,
    SpeakersModule,
    BlogsModule,
    BlogReferencesModule,
    CategoriesModule,
    HomeSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
