import { Injectable, NotFoundException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { error } from 'console';
import { StorageService } from 'src/storage/storage.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsExistingMediaConstrain implements ValidatorConstraintInterface {
  constructor(private readonly storageService: StorageService) {}

  async validate(url: string) {
    try {
      const img = await this.storageService.findOneByURL(url);
      if (!img) return false;
      console.log('the URL inserted Media ID is ', img.id); // ✅ safe now
      return true;
    } catch {
      return false;
    }
  }
  defaultMessage(args: ValidationArguments) {
    return `Media with URL "${args.value}" does not exist`;
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