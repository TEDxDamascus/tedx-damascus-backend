import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { Partner, PartnerSchema } from './schema/partner.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from 'src/storage/entities/media.entity';
import { StorageModule } from 'src/storage/storage.module';
import { IsExistingMediaConstrain } from 'src/common/decorators/is-existing-media.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Partner.name,
        schema: PartnerSchema,
      },
      {
        name: Media.name,
        schema: MediaSchema,
      },
    ]),
    StorageModule,
  ],
  controllers: [PartnersController],
  providers: [PartnersService, IsExistingMediaConstrain],
})
export class PartnersModule {}
