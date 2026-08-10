import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';
import { CardSizeEnum } from '../schema/partner.card.size.enum';
import { TierTypeEnum } from '../schema/partner.tier-type.enum';

export class TierDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDefined()
  @IsEnum(TierTypeEnum, {
    message: `type must be one of: [${Object.values(TierTypeEnum).join(', ')}]`,
  })
  type!: TierTypeEnum;

  @ValidateIf((o: TierDto) => o.type === TierTypeEnum.OTHER)
  @IsDefined({ message: 'size is required when type is Other' })
  @IsEnum(CardSizeEnum, {
    message: `size must be one of: [${Object.values(CardSizeEnum).join(', ')}]`,
  })
  size?: CardSizeEnum;
}
