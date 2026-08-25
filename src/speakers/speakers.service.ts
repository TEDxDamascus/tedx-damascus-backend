import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Speaker } from './schemas/speaker.schema';
import { translateFieldHelper } from '../common/utils/translate.helper';
import { PaginationQueryDto } from 'src/events/dto/pagination.dto';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class SpeakersService {
  constructor(
    @InjectModel(Speaker.name) private readonly speakerModel: Model<Speaker>,
    private readonly storageservice: StorageService,
  ) {}
  //! Create Speaker
  async create(createSpeakerDto: CreateSpeakerDto) {
    const { gallery, ...rest } = createSpeakerDto;

    const speakerImage = await this.storageservice.findOneByURL(
      createSpeakerDto.speaker_image,
    );
    if (!speakerImage) {
      throw new NotFoundException(
        `Media with URL "${createSpeakerDto.speaker_image}" not found`,
      );
    }

    const payload: Record<string, unknown> = {
      ...rest,
      speaker_image: speakerImage._id,
    };

    if (gallery?.length) {
      const galleryDocs = await Promise.all(
        gallery.map((url) => this.storageservice.findOneByURL(url)),
      );
      const missingIndex = galleryDocs.findIndex((g) => !g);
      if (missingIndex !== -1) {
        throw new NotFoundException(
          `Media with URL "${gallery[missingIndex]}" not found`,
        );
      }
      payload.gallery = galleryDocs.map((g) => g._id);
    }

    const newSpeaker = new this.speakerModel(payload);
    return newSpeaker.save();
  }
  //! Get all Speakers
  async findAll(lang: string, paginationQueryDto: PaginationQueryDto) {
    const { limit, offset } = paginationQueryDto;
    const speakers = await this.speakerModel
      .find()
      .skip(offset)
      .limit(limit)
      .populate('speaker_image', 'url -_id')
      .populate('gallery', 'url -_id')
      .lean()
      .exec();
    return speakers.map((speaker) => ({
      ...speaker,
      speaker_image: speaker.speaker_image?.url,
      gallery: speaker.gallery?.map((gall) => gall.url) ?? [],
    }));
  }

  //! Find Speaker By Id
  async findOne(id: string, lang: string) {
    const speaker = await this.speakerModel
      .findById(id)
      .populate('speaker_image', 'url -_id')
      .populate('gallery', 'url -_id')
      .lean()
      .exec();
    if (!speaker)
      throw new NotFoundException(`Speaker with id ${id} was not found`);
    return {
      ...speaker,
      speaker_image: speaker.speaker_image?.url,
      gallery: speaker.gallery?.map((gall) => gall.url) ?? [],
    };
  }
  //! Update Speaker By Id
  async update(id: string, updateSpeakerDto: UpdateSpeakerDto) {
    const { speaker_image, gallery, ...rest } = updateSpeakerDto;
    const payload: Record<string, unknown> = { ...rest };

    if (speaker_image) {
      const media = await this.storageservice.findOneByURL(speaker_image);
      if (!media) {
        throw new NotFoundException(
          `Media with URL "${speaker_image}" not found`,
        );
      }
      payload.speaker_image = media._id;
    }

    if (gallery !== undefined) {
      if (gallery.length === 0) {
        payload.gallery = [];
      } else {
        const galleryDocs = await Promise.all(
          gallery.map((url) => this.storageservice.findOneByURL(url)),
        );
        const missingIndex = galleryDocs.findIndex((g) => !g);
        if (missingIndex !== -1) {
          throw new NotFoundException(
            `Media with URL "${gallery[missingIndex]}" not found`,
          );
        }
        payload.gallery = galleryDocs.map((g) => g._id);
      }
    }

    const speaker = await this.speakerModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with id ${id} was not found`);
    }

    return speaker;
  }
  //! Delete Speaker By Id
  async remove(id: string) {
    const speaker = await this.speakerModel.findByIdAndDelete(id);
    if (!speaker) {
      throw new NotFoundException(`Speaker with id ${id} was not found`);
    }
    return {
      message: `speaker (${speaker.name.en} | ${speaker.name.ar}) deleted successfully`,
    };
  }
}
