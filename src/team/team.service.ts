import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './schema/team.schema';
import { translateFieldHelper } from 'src/common/utils/translate.helper';
import { PaginationQueryDto } from 'src/events/dto/pagination.dto';
import { TeamQueryDto } from './dto/search-team.dto';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(Team.name) private readonly teamModel: Model<Team>,
    private readonly storageservice: StorageService,
  ) {}
  //! Create New Team Member
  async create(createTeamDto: CreateTeamDto) {
    const teamImage = await this.storageservice.findOneByURL(
      createTeamDto.image,
    );
    const newTeam = new this.teamModel({
      ...createTeamDto,
      image: teamImage.id,
    });
    return newTeam.save();
  }

  //! Get All Team Members
  async findAll(
    lang: string,
    paginationQueryDto: PaginationQueryDto,
    teamQuery: TeamQueryDto,
  ) {
    //! add filtering by Name
    const { limit, offset } = paginationQueryDto;
    const { name, year } = teamQuery;

    const filters: Record<string, unknown> = {};

    if (name?.trim()) {
      const cleanName = name.trim();
      const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filters[`name.${lang}`] = {
        $regex: escaped,
        $options: 'i',
      };
    }
    if (year) {
      filters.year = Number(year);
    }

    const team = await this.teamModel
      .find(filters)
      .lean()
      .skip(offset ?? 0)
      .limit(limit ?? 10)
      .exec();
    return team.map((teamMember) => ({
      ...teamMember,
      name: translateFieldHelper(teamMember.name, lang),
      bio: translateFieldHelper(teamMember.bio, lang),
    }));
  }

  //! Get Team Member Detail
  async findOne(id: string, lang: string) {
    const teamMember = await this.teamModel.findById(id).lean().exec();
    if (!teamMember)
      throw new NotFoundException(`Team Member with id ${id} was not found`);
    return {
      ...teamMember,
      name: translateFieldHelper(teamMember.name, lang),
      bio: translateFieldHelper(teamMember.bio, lang),
    };
  }

  //! Get Team Member By ID
  update(id: string, updateTeamDto: UpdateTeamDto) {
    const teamMember = this.teamModel
      .findByIdAndUpdate(id, updateTeamDto, {
        new: true,
        runValidators: true,
      })
      .lean()
      .exec();
    if (!teamMember)
      throw new NotFoundException(`Team Member with id ${id} was not found`);
    return teamMember;
  }

  //! Remove Team Member By ID
  remove(id: string) {
    const teamMember = this.teamModel.findByIdAndDelete(id).lean().exec();
    if (!teamMember)
      throw new NotFoundException(`Team Member with id ${id} was not found`);
    return teamMember;
  }
}
