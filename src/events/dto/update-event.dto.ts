import { PartialType, OmitType } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { IsExistingSpeaker } from '../../common/decorators/is-existing-speaker.decorator';
import { IsExistingTeam } from '../../common/decorators/is-existing-team.decorator';
import { IsExistingMedia } from '../../common/decorators/is-existing-media.decorator';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(
  OmitType(CreateEventDto, ['gallery', 'speakers', 'team_members'] as const),
) {
  //! Gallery — [] allowed on update to clear it
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @IsExistingMedia({
    each: true,
    message: 'One or more gallery images do not exist in storage',
  })
  gallery?: string[];

  //! Speakers — [] allowed on update to clear it
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique({ message: 'Each speaker can only be added once' })
  @IsExistingSpeaker({ each: true })
  speakers?: string[];

  //! Team Members — [] allowed on update to clear it
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique({ message: 'Each team member can only be added once' })
  @IsExistingTeam({ each: true })
  team_members?: string[];
}
