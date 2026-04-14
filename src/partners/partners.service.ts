import { Injectable } from '@nestjs/common';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Partner } from './schema/partner.schema';
import { Model } from 'mongoose';

@Injectable()
export class PartnersService {
  constructor(
    @InjectModel(Partner.name) private readonly partnerModel: Model<Partner>,
  ) {}

  create(createPartnerDto: CreatePartnerDto) {
    const newPartner = new this.partnerModel(createPartnerDto);
    return newPartner.save();
  }

  findAll() {
    return this.partnerModel.find().exec();
  }

  findOne(id: string) {
    return `This action returns a #${id} partner`;
  }

  update(id: string, updatePartnerDto: UpdatePartnerDto) {
    return `This action updates a #${id} partner`;
  }

  remove(id: string) {
    return `This action removes a #${id} partner`;
  }
}
