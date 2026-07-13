import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { TeamService } from '../../team/team.service';
import { Types } from 'mongoose';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsExistingTeamConstrain implements ValidatorConstraintInterface {
  constructor(private readonly teamService: TeamService) {}

  async validate(id: string) {
    if (!Types.ObjectId.isValid(id)) return false;

    try {
      const teamMember = await this.teamService.findOne(id, 'en');
      return !!teamMember;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `Team member with id "${args.value}" does not exist`;
  }
}

export function IsExistingTeam(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsExistingTeamConstrain,
    });
  };
}
