import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SpeakersModule } from './speakers/speakers.module';
import { BlogsModule } from './blogs/blogs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      
    }),
    // process.env.MONGODB_URI || i removed it coz i dont wanna connect to the Atlas right now
    MongooseModule.forRoot('mongodb://localhost:27017/tedx-damascus'),
    AuthModule,
    EventsModule,
    SpeakersModule,
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
