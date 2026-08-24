import { PartialType, OmitType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUrl } from 'class-validator';
import { IsExistingMedia } from '../../common/decorators/is-existing-media.decorator';
import { CreateOrganizerDto } from './create-organizer.dto';

export class UpdateOrganizerDto extends PartialType(
  OmitType(CreateOrganizerDto, ['gallery'] as const),
) {
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @IsExistingMedia({
    each: true,
    message: 'One or more gallery images do not exist in storage',
  })
  gallery?: string[];
}
