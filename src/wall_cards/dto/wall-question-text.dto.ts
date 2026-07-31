import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneWallQuestionLang', async: false })
export class AtLeastOneWallQuestionLangConstraint
  implements ValidatorConstraintInterface
{
  validate(text: { en?: string; ar?: string } | undefined): boolean {
    return Boolean(text?.en?.trim() || text?.ar?.trim());
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must include at least one non-empty language (en or ar)`;
  }
}

export class WallQuestionTextDto {
  @ApiPropertyOptional({ example: 'What inspires you?' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  en?: string;

  @ApiPropertyOptional({ example: 'ما الذي يلهمك؟' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ar?: string;
}
