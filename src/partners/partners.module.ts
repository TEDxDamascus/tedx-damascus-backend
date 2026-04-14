import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { Partner, PartnerSchema } from './schema/partner.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports:[
        MongooseModule.forFeature([
          {
            name: Partner.name,
            schema: PartnerSchema,
          },
          // {
          //   name: Media.name,
          //   schema: MediaSchema,
          // },
        ]),
  ],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
