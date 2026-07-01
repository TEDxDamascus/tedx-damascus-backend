import { ForbiddenException, GoneException } from '@nestjs/common';
import { WallAnswerStatus } from '../entities/wall-answer.entity';
import { WallQuestionStatus } from '../entities/wall-question.entity';

export type WallQuestionAvailabilityFields = {
  status: WallQuestionStatus;
  expiresAt: Date;
};

export type WallAnswerApprovalFields = {
  status: WallAnswerStatus;
};

export function throwIfQuestionNotAcceptingAnswers(
  question: WallQuestionAvailabilityFields,
  messageExpired: string,
  messageNotAccepting: string,
  now: Date = new Date(),
): void {
  if (question.status !== 'active') {
    throw new ForbiddenException(messageNotAccepting);
  }

  if (now >= question.expiresAt) {
    throw new GoneException(messageExpired);
  }
}

export function throwIfAnswerNotApprovable(
  questionStatus: WallQuestionStatus,
  answerStatus: WallAnswerStatus,
  messageArchived: string,
  messageNotApprovable: string,
): void {
  if (questionStatus === 'archived' || answerStatus === 'archived') {
    throw new ForbiddenException(messageArchived);
  }

  if (answerStatus !== 'pending') {
    throw new ForbiddenException(messageNotApprovable);
  }
}
