import { PartialType, OmitType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUrl } from 'class-validator';
import { IsExistingMedia } from '../../common/decorators/is-existing-media.decorator';
import { CreateSpeakerDto } from './create-speaker.dto';

export class UpdateSpeakerDto extends PartialType(
  OmitType(CreateSpeakerDto, ['gallery', 'video_link'] as const),
) {
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @IsExistingMedia({
    each: true,
    message: 'One or more gallery images do not exist in storage',
  })
  gallery?: string[]; // [] allowed on update — means "clear the gallery"

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  video_link?: string[]; // [] allowed on update

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  social_links!: string[];
}
