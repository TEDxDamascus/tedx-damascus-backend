import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Speaker } from './schemas/speaker.schema';

@Injectable()
export class SpeakersService {
  constructor(
    @InjectModel(Speaker.name) private readonly speakerModel: Model<Speaker>,
  ) {}
  create(createSpeakerDto: CreateSpeakerDto) {
    const newSpeaker = new this.speakerModel(createSpeakerDto);
    return newSpeaker.save();
  }

  async findAll() {
    const speakers = await this.speakerModel.find().exec();
    return speakers;
  }

  async findOne(id: string) {
    const speaker = await this.speakerModel.findById(id);
    if (!speaker)
      throw new NotFoundException(`Speaker with id ${id} was not found`);
    return speaker;
  }

  async update(id: string, updateSpeakerDto: UpdateSpeakerDto) {
    const speaker = await this.speakerModel.findByIdAndUpdate(
      id,
      updateSpeakerDto,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!speaker)
      throw new NotFoundException(`Speaker with id ${id} was not found`);
    return speaker;
  }

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
