import { Injectable } from '@nestjs/common';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';

@Injectable()
export class SpeakersService {
  create(_createSpeakerDto: CreateSpeakerDto) {
    void _createSpeakerDto;
    return 'This action adds a new speaker';
  }

  findAll() {
    return `This action returns all speakers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} speaker`;
  }

  update(id: number, _updateSpeakerDto: UpdateSpeakerDto) {
    void _updateSpeakerDto;
    return `This action updates a #${id} speaker`;
  }

  remove(id: number) {
    return `This action removes a #${id} speaker`;
  }
}
