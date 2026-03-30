import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Types } from 'mongoose';
import { StorageService } from 'src/storage/storage.service';

@ValidatorConstraint({ async: true }) 
@Injectable()
export class IsExistingMediaConstrain implements ValidatorConstraintInterface {
  constructor(private readonly storageService: StorageService) {}
  async validate(id: string) {
    if (!Types.ObjectId.isValid(id)) return false;
    const img = await this.storageService.findOneById(id);
    return !!img;
  }
  defaultMessage(args: ValidationArguments) {
    return `Media with id "${args.value}" does not exist`;
  }
}

export function IsExistingMedia(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsExistingMediaConstrain,
    });
  };
}
