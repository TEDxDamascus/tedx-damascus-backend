import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FormQuestion, QuestionType } from '../entities/form-question.schema';

export type QuestionWithId = FormQuestion & { _id?: Types.ObjectId };

export function getQuestionId(question: QuestionWithId): string | undefined {
  return question._id?.toString();
}

export function findQuestion(
  questions: QuestionWithId[],
  id: string,
): QuestionWithId | undefined {
  return questions.find((q) => getQuestionId(q) === id);
}

export function hasChildren(questions: QuestionWithId[], sectionId: string): boolean {
  return questions.some(
    (q) => q.parentId?.toString() === sectionId,
  );
}

export function assertSectionConstraints(
  type: QuestionType,
  isRequired?: boolean,
  options?: unknown[],
): void {
  if (type !== 'section') return;
  if (isRequired === true) {
    throw new BadRequestException('Section questions cannot be required');
  }
  if (options && options.length > 0) {
    throw new BadRequestException('Section questions cannot have options');
  }
}

export function assertCannotDemoteSectionWithChildren(
  questions: QuestionWithId[],
  questionId: string,
  newType: QuestionType,
): void {
  const current = findQuestion(questions, questionId);
  if (!current || current.type !== 'section' || newType === 'section') return;
  if (hasChildren(questions, questionId)) {
    throw new BadRequestException(
      'Cannot change type while questions are nested under this section',
    );
  }
}

function parentIdKey(parentId: Types.ObjectId | null | undefined): string {
  return parentId?.toString() ?? '';
}

export function wouldCreateCycle(
  questions: QuestionWithId[],
  questionId: string,
  newParentId: string,
): boolean {
  let currentId: string | undefined = newParentId;
  while (currentId) {
    if (currentId === questionId) return true;
    const parent = findQuestion(questions, currentId);
    currentId = parent?.parentId?.toString();
  }
  return false;
}

export function assertValidParent(
  questions: QuestionWithId[],
  parentId: string | null | undefined,
  selfId?: string,
): void {
  if (parentId == null || parentId === '') return;
  if (selfId && parentId === selfId) {
    throw new BadRequestException('A question cannot be its own parent');
  }
  const parent = findQuestion(questions, parentId);
  if (!parent) {
    throw new BadRequestException('Parent question not found');
  }
  if (parent.type !== 'section') {
    throw new BadRequestException('Parent must be a section question');
  }
  if (selfId && wouldCreateCycle(questions, selfId, parentId)) {
    throw new BadRequestException('Invalid parent: would create a cycle');
  }
}

export function rerootChildrenOnSectionDelete(
  questions: QuestionWithId[],
  deletedSectionId: string,
  newParentId: Types.ObjectId | null,
): void {
  for (const q of questions) {
    if (q.parentId?.toString() === deletedSectionId) {
      if (newParentId) {
        q.parentId = newParentId;
      } else {
        q.parentId = undefined;
      }
    }
  }
}

export function validateQuestionTree(questions: QuestionWithId[]): void {
  for (const q of questions) {
    const qId = getQuestionId(q);
    if (!qId) continue;

    if (q.type === 'section') {
      if (q.isRequired) {
        throw new BadRequestException(
          `Section ${qId} cannot be marked as required`,
        );
      }
      if (q.options?.length) {
        throw new BadRequestException(`Section ${qId} cannot have options`);
      }
    }

    const parentStr = q.parentId?.toString();
    if (!parentStr) continue;

    const parent = findQuestion(questions, parentStr);
    if (!parent) {
      throw new BadRequestException(
        `Question ${qId} references missing parent ${parentStr}`,
      );
    }
    if (parent.type !== 'section') {
      throw new BadRequestException(
        `Question ${qId} parent must be a section`,
      );
    }
    if (wouldCreateCycle(questions, qId, parentStr)) {
      throw new BadRequestException(
        `Question ${qId} is part of an invalid parent cycle`,
      );
    }
  }
}

export function resolveParentId(
  parentId: string | null | undefined,
): Types.ObjectId | undefined {
  if (parentId == null || parentId === '') return undefined;
  return new Types.ObjectId(parentId);
}

export function sortQuestionsSiblingOrder(
  questions: QuestionWithId[],
): QuestionWithId[] {
  return questions.slice().sort((a, b) => {
    const pa = parentIdKey(a.parentId);
    const pb = parentIdKey(b.parentId);
    if (pa !== pb) return pa.localeCompare(pb);
    return a.orderIndex - b.orderIndex;
  });
}
