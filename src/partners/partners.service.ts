import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Partner } from './schema/partner.schema';
import { Model } from 'mongoose';
import { translateFieldHelper } from 'src/common/utils/translate.helper';

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

  //! return all partners + language
  async findAll(lang: string) {
    const partners = await this.partnerModel.find().lean().exec();
    if (!partners)
      throw new NotFoundException(`Something Went Wrong no partners`);
    return partners.map((foundPartner) => ({
      ...foundPartner,
      name: translateFieldHelper(foundPartner.name, lang),
      slug: translateFieldHelper(foundPartner.slug, lang),
      description: translateFieldHelper(foundPartner.description, lang),
    }));
    {
    }
  }

  //! find existing partner by Id + language+ language
  async findOne(id: string, lang: string) {
    const foundPartner = await this.partnerModel.findById(id).lean().exec();
    if (!foundPartner)
      throw new NotFoundException(`Partner with id ${id} was not found`);

    return {
      ...foundPartner,
      name: translateFieldHelper(foundPartner.name, lang),
      slug: translateFieldHelper(foundPartner.slug, lang),
      description: translateFieldHelper(foundPartner.description, lang),
    };
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
