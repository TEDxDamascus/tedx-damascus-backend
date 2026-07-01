import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeSettingsDto } from './create-home-settings.dto';

export class UpdateHomeSettingsDto extends PartialType(CreateHomeSettingsDto) {}
