import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { EventsService } from '../../events/events.service';
import { Types } from 'mongoose';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsExistingEventConstrain implements ValidatorConstraintInterface {
  constructor(private readonly eventsService: EventsService) {}

  async validate(id: string) {
    if (!Types.ObjectId.isValid(id)) return false;
    try {
      return await this.eventsService.exists(id);
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `One or more ids in "${args.property}" do not exist in the database`;
  }
}

export function IsExistingEvent(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsExistingEventConstrain,
    });
  };
}
