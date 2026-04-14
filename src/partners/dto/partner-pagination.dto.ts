import { IsOptional, IsString } from 'class-validator';

export class PartnerQueryDto {
  //! searching with name
  @IsOptional()
  @IsString()
  name?: string;

  //TODO add filtering by the partnership type  when sdra give them to me

  //! filtering by event-type
  //   @IsOptional()
  //   @IsString()
  //   @IsEnum(EventType, {
  //     message: `event_type must be one of: [${Object.values(EventType).join(', ')}]`,
  //   })
  //   type?: EventType;
}
