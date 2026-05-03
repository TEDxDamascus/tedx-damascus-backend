import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Organizer } from './schema/organizer.schema';
import { Model } from 'mongoose';

@Injectable()
export class OrganizerService {
  constructor(
    @InjectModel(Organizer.name)
    private readonly organizerModel: Model<Organizer>,
  ) {}

  //! Creating new Org
  create(createOrganizerDto: CreateOrganizerDto) {
    const org = new this.organizerModel({ createOrganizerDto });
    return org.save();
  }

  //! Get ALl orgs
  findAll() {
    const data = this.organizerModel.find();
    return data;
  }

  //! get org details by id
  findOne(id: string) {
    const org = this.organizerModel.findById(id);
    return org;
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
    return org;
  }
}
