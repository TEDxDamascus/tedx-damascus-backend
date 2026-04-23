import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HomeSettings, HomeSettingsDocument } from './entities/home-settings.entity';
import { CreateHomeSettingsDto } from './dto/create-home-settings.dto';
import { UpdateHomeSettingsDto } from './dto/update-home-settings.dto';

@Injectable()
export class HomeSettingsService {
  constructor(
    @InjectModel(HomeSettings.name)
    private readonly homeSettingsModel: Model<HomeSettingsDocument>,
  ) {}

  async create(createHomeSettingsDto: CreateHomeSettingsDto) {
    const homeSettings = await this.homeSettingsModel.create(createHomeSettingsDto);

    return this.findOne(homeSettings.id);
  }

  async findAll() {
    return this.homeSettingsModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const homeSettings = await this.homeSettingsModel.findById(id);

    if (!homeSettings) {
      throw new NotFoundException('Home settings not found');
    }

    return homeSettings;
  }

  async update(id: string, updateHomeSettingsDto: UpdateHomeSettingsDto) {
    const homeSettings = await this.homeSettingsModel.findByIdAndUpdate(
      id,
      updateHomeSettingsDto,
      { new: true, runValidators: true },
    );

    if (!homeSettings) {
      throw new NotFoundException('Home settings not found');
    }

    return homeSettings;
  }

  async remove(id: string) {
    const homeSettings = await this.homeSettingsModel.findByIdAndDelete(id);

    if (!homeSettings) {
      throw new NotFoundException('Home settings not found');
    }

    return { message: 'Home settings deleted successfully' };
  }
}
