import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const WALL_ANSWER_MODERATION_ACTIONS = ['approve', 'decline'] as const;
export type WallAnswerModerationAction =
  (typeof WALL_ANSWER_MODERATION_ACTIONS)[number];

export class ModerateWallAnswerDto {
  @ApiProperty({ enum: WALL_ANSWER_MODERATION_ACTIONS })
  @IsIn(WALL_ANSWER_MODERATION_ACTIONS)
  action: WallAnswerModerationAction;
}

