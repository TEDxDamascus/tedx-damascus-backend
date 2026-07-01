import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Partner } from './schema/partner.schema';
import { translateFieldHelper } from 'src/common/utils/translate.helper';
import { PaginationQueryDto } from 'src/events/dto/pagination.dto';
import { PartnerQueryDto } from './dto/partner-pagination.dto';
import { Model } from 'mongoose';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class PartnersService {
  constructor(
    @InjectModel(Partner.name) private readonly partnerModel: Model<Partner>,
    private readonly storageservice: StorageService,
  ) {}

  //! Create new partners
  async create(createPartnerDto: CreatePartnerDto) {
    const partnerImage = await this.storageservice.findOneByURL(
      createPartnerDto.image,
    );

    const newPartner = new this.partnerModel({
      ...createPartnerDto,
      image: partnerImage._id,
    });
    return newPartner.save();
  }

  //! return all partners + language
  async findAll(
    lang: string,
    paginationQueryDto: PaginationQueryDto,
    partnerQuery: PartnerQueryDto, //TODO filter by name and partnership type
  ) {
    const { limit, offset } = paginationQueryDto;
    const { name } = partnerQuery;

    const filter: any = {};
    if (name) {
      filter[`name.${lang}`] = { $regex: `^${name}`, $options: 'i' };
    }

    const partners = await this.partnerModel
      .find(filter)
      .skip(offset)
      .limit(limit)
      .populate('image')
      .lean()
      .exec();
    if (!partners)
      throw new NotFoundException(`Something Went Wrong no partners`);
    return partners;
    {
    }
  }

  //! find existing partner by Id + language+ language
  async findOne(id: string, lang: string) {
    const foundPartner = await this.partnerModel
      .findById(id)
      .populate('image')
      .lean()
      .exec();
    if (!foundPartner)
      throw new NotFoundException(`Partner with id ${id} was not found`);

    return {
      ...foundPartner,

      // name: translateFieldHelper(foundPartner.name, lang),
      // slug: translateFieldHelper(foundPartner.slug, lang),
      // long_description: translateFieldHelper(
      //   foundPartner.long_description,
      //   lang,
      // ),
      // short_description: translateFieldHelper(
      //   foundPartner.short_description,
      //   lang,
      // ),
      // contact_info: {
      //   ...foundPartner.contact_info,
      //   address: translateFieldHelper(foundPartner.contact_info.address, lang),
      // },
      // services: foundPartner.services?.map((s) => ({
      //   ...s,
      //   description: translateFieldHelper(s.description, lang),
      // })),
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
