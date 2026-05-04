import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Organizer } from './schema/organizer.schema';
import { Model } from 'mongoose';
import { translateFieldHelper } from 'src/common/utils/translate.helper';

@Injectable()
export class OrganizerService {
  constructor(
    @InjectModel(Organizer.name)
    private readonly organizerModel: Model<Organizer>,
  ) {}

  //! Creating new Org
  create(createOrganizerDto: CreateOrganizerDto) {
    const org = new this.organizerModel(createOrganizerDto);
    return org.save();
  }
  //! Get ALl orgs
  async findAll(lang: string) {
    const data = await this.organizerModel.find().lean().exec();
    return data.map((org) => ({
      ...org,
      name: translateFieldHelper(org.name, lang),
      bio: translateFieldHelper(org.bio, lang),
    }));
  }

  //! get org details by id
  async findOne(id: string, lang: string) {
    const data = await this.organizerModel.findById(id);
    if (!data) throw new NotFoundException(`org with id ${id} was not found`);

    return {
      ...data,
      name: translateFieldHelper(data.name, lang),
      bio: translateFieldHelper(data.bio, lang),
    };
  }

  //! update org details by id
  update(id: string, updateOrganizerDto: UpdateOrganizerDto) {
    const org = this.organizerModel.findByIdAndUpdate(id, updateOrganizerDto, {
      new: true,
      runValidators: true,
    });
    if (!org) throw new NotFoundException(`org with id ${id} was not found`);
    return org;
  }

  //! remove org by id
  remove(id: string) {
    const org = this.organizerModel.findByIdAndDelete(id);
    if (!org) throw new NotFoundException(`org with id ${id} was not found`);
    return org;
  }
}
