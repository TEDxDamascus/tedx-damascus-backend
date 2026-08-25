import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Organizer } from './schema/organizer.schema';
import { Model } from 'mongoose';
import { translateFieldHelper } from 'src/common/utils/translate.helper';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class OrganizerService {
  constructor(
    @InjectModel(Organizer.name)
    private readonly organizerModel: Model<Organizer>,
    private readonly storageservice: StorageService,
  ) {}

  //! Creating new Org
  //! Creating new Org
  async create(createOrganizerDto: CreateOrganizerDto) {
    const { image, gallery, ...rest } = createOrganizerDto;

    const orgImage = await this.storageservice.findOneByURL(image);
    if (!orgImage) {
      throw new NotFoundException(`Media with URL "${image}" not found`);
    }

    const payload: Record<string, unknown> = {
      ...rest,
      image: orgImage._id,
    };

    if (gallery?.length) {
      const orgGallery = await Promise.all(
        gallery.map((url) => this.storageservice.findOneByURL(url)),
      );
      const missingIndex = orgGallery.findIndex((g) => !g);
      if (missingIndex !== -1) {
        throw new NotFoundException(
          `Media with URL "${gallery[missingIndex]}" not found`,
        );
      }
      payload.gallery = orgGallery.map((g) => g._id);
    }

    const org = new this.organizerModel(payload);
    return org.save();
  }
  //! Get ALl orgs
  async findAll(lang: string) {
    const data = await this.organizerModel
      .find()
      .populate('image', 'url -_id')
      .populate('gallery', 'url -_id')
      .lean()
      .exec();
    return data.map((org) => ({
      ...org,
      // name: translateFieldHelper(org.name, lang),
      // bio: translateFieldHelper(org.bio, lang),
    }));
  }

  //! get org details by id
  async findOne(id: string, lang: string) {
    const data = await this.organizerModel
      .findById(id)
      .populate('image', 'url -_id')
      .populate('gallery', 'url -_id')
      .lean()
      .exec();
    if (!data) throw new NotFoundException(`Org with id ${id} was not found`);

    return {
      ...data,
      // name: translateFieldHelper(data.name, lang),
      // bio: translateFieldHelper(data.bio, lang),
    };
  }

  //! update org details by id
  //! update org details by id
  async update(id: string, updateOrganizerDto: UpdateOrganizerDto) {
    const { image, gallery, ...rest } = updateOrganizerDto;
    const payload: Record<string, unknown> = { ...rest };

    if (image) {
      const orgImage = await this.storageservice.findOneByURL(image);
      if (!orgImage) {
        throw new NotFoundException(`Media with URL "${image}" not found`);
      }
      payload.image = orgImage._id;
    }

    if (gallery !== undefined) {
      if (gallery.length === 0) {
        payload.gallery = [];
      } else {
        const orgGallery = await Promise.all(
          gallery.map((url) => this.storageservice.findOneByURL(url)),
        );
        const missingIndex = orgGallery.findIndex((g) => !g);
        if (missingIndex !== -1) {
          throw new NotFoundException(
            `Media with URL "${gallery[missingIndex]}" not found`,
          );
        }
        payload.gallery = orgGallery.map((g) => g._id);
      }
    }

    const org = await this.organizerModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!org) {
      throw new NotFoundException(`Organizer with id ${id} was not found`);
    }

    return org;
  }

  //! remove org by id
  async remove(id: string) {
    const org = await this.organizerModel.findByIdAndDelete(id);
    if (!org) throw new NotFoundException(`org with id ${id} was not found`);
    return org;
  }
}
