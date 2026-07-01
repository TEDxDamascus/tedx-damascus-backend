import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HomeSettings,
  HomeSettingsDocument,
} from './entities/home-settings.entity';
import { CreateHomeSettingsDto } from './dto/create-home-settings.dto';
import { UpdateHomeSettingsDto } from './dto/update-home-settings.dto';
import { HomeSectionSettingsDto } from './dto/home-section-settings.dto';

@Injectable()
export class HomeSettingsService {
  constructor(
    @InjectModel(HomeSettings.name)
    private readonly homeSettingsModel: Model<HomeSettingsDocument>,
  ) {}

  async create(createHomeSettingsDto: CreateHomeSettingsDto) {
    const homeSettings = await this.homeSettingsModel.create(
      this.prepareHomeSettingsPayload(createHomeSettingsDto),
    );

    return this.findOne(homeSettings.id);
  }

  async findAll() {
    const homeSettings = await this.homeSettingsModel
      .find()
      .sort({ createdAt: -1 });

    return homeSettings.map((settings) => this.serializeHomeSettings(settings));
  }

  async findOne(id: string) {
    const homeSettings = await this.homeSettingsModel.findById(id);

    if (!homeSettings) {
      throw new NotFoundException('Home settings not found');
    }

    return this.serializeHomeSettings(homeSettings);
  }

  async update(id: string, updateHomeSettingsDto: UpdateHomeSettingsDto) {
    const homeSettings = await this.homeSettingsModel.findByIdAndUpdate(
      id,
      this.prepareHomeSettingsPayload(updateHomeSettingsDto),
      { new: true, runValidators: true },
    );

    if (!homeSettings) {
      throw new NotFoundException('Home settings not found');
    }

    return this.serializeHomeSettings(homeSettings);
  }

  async remove(id: string) {
    const homeSettings = await this.homeSettingsModel.findByIdAndDelete(id);

    if (!homeSettings) {
      throw new NotFoundException('Home settings not found');
    }

    return { message: 'Home settings deleted successfully' };
  }

  private prepareHomeSettingsPayload(
    payload: Partial<CreateHomeSettingsDto>,
  ): Partial<CreateHomeSettingsDto> {
    const sections = {
      ...(payload.sections || {}),
    };

    if (payload.hero) {
      sections.hero = {
        ...sections.hero,
        ...payload.hero,
      };
    }

    const hero = sections.hero || payload.hero;

    return {
      ...payload,
      hero,
      sections,
    };
  }

  private serializeHomeSettings(homeSettings: HomeSettingsDocument) {
    const settings = homeSettings.toObject();
    const sections = this.normalizeSections(settings.sections);

    return {
      ...settings,
      hero: settings.hero || sections.hero,
      sections,
    };
  }

  private normalizeSections(
    sections?:
      | Map<string, HomeSectionSettingsDto>
      | Record<string, HomeSectionSettingsDto>,
  ) {
    if (!sections) {
      return {};
    }

    if (sections instanceof Map) {
      return Object.fromEntries(sections);
    }

    return sections;
  }
}
