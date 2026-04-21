import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './schema/team.schema';
import { translateFieldHelper } from 'src/common/utils/translate.helper';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(Team.name) private readonly teamModel: Model<Team>,
  ) {}
  //! Create New Team Member
  create(createTeamDto: CreateTeamDto) {
    const newTeam = new this.teamModel(createTeamDto);
    return newTeam.save();
  }

  //! Get All Team Members
  async findAll(lang: string) {
    const team = await this.teamModel.find().lean().exec();
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
