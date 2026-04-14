import { Injectable, NotFoundException } from '@nestjs/common';
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

  //! Create new partners
  create(createPartnerDto: CreatePartnerDto) {
    const newPartner = new this.partnerModel(createPartnerDto);
    return newPartner.save();
  }

  //! return all partners
  findAll() {
    return this.partnerModel.find().exec();
  }

  //! find existing partner by Id
  findOne(id: string) {
    const foundPartner = this.partnerModel.findById(id).exec();
    return foundPartner;
  }

  //! Update existing partner by Id
  async update(id: string, updatePartnerDto: UpdatePartnerDto) {
    const partner = await this.partnerModel
      .findByIdAndUpdate(id, updatePartnerDto, {
        new: true,
        runValidators: true,
      })
      .exec();
    if (!partner) {
      throw new NotFoundException(`partner with id ${id} was not found`);
    }
    return partner;
  }

  //! Delete existing partner by Id
  remove(id: string) {
    const partner = this.partnerModel.findByIdAndDelete(id).exec();
    return partner;
  }
}
