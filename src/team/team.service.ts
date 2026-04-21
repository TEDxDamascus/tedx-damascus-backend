import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './schema/team.schema';

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
  findAll() {
    const team = this.teamModel.find().lean().exec();
    return team;
  }

  //! Get Team Member Detail
  findOne(id: string) {
    const teamMember = this.teamModel.findById(id).lean().exec();
    return teamMember;
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
    return teamMember;
  }

  //! Remove Team Member By ID
  remove(id: string) {
    const teamMember = this.teamModel.findByIdAndDelete(id).lean().exec();
    return teamMember;
  }
}
