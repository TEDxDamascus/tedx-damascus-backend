import { PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { CreateTeamDto } from './create-team.dto';
import { IsExistingEvent } from 'src/common/decorators/is-existing-event.decorator';

export class UpdateTeamDto extends PartialType(
  OmitType(CreateTeamDto, ['events', 'social_links'] as const),
) {
  //! events
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @IsExistingEvent({ each: true })
  @ArrayUnique({ message: 'events must not contain duplicate ids' })
  events?: string[];

  //! social links
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  social_links?: string[];
}
