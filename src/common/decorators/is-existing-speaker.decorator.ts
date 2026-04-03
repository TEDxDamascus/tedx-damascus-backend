import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { SpeakersService } from '../../speakers/speakers.service';
import { Types } from 'mongoose';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsExistingSpeakerConstrain implements ValidatorConstraintInterface {
  constructor(private readonly speakerService: SpeakersService) {}

  async validate(id: string) {
    // 👇 Guard: skip DB call if not a valid ObjectId
    if (!Types.ObjectId.isValid(id)) return false;

    const speaker = await this.speakerService.findOne(id, 'en');
    return !!speaker;
  }

  defaultMessage(args: ValidationArguments) {
    return `Speaker with id "${args.value}" does not exist`;
  }
}

export function IsExistingSpeaker(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsExistingSpeakerConstrain,
    });
  };
}
