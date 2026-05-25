import { Types } from 'mongoose';
import { translateFieldHelper } from '../../common/utils/translate.helper';
import { WallAnswerDocument } from '../entities/wall-answer.entity';
import { WallQuestionDocument } from '../entities/wall-question.entity';

export type WallQuestionResponse = {
  id: string;
  text: string;
  expiresAt: string;
  categoryId?: string;
  tags: string[];
  status: string;
  publishedAt: string;
  publishedBy?: string;
  archivedAt?: string;
  replacedByQuestionId?: string;
  featuredAnswerIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type WallAnswerResponse = {
  id: string;
  questionId: string;
  text: string;
  displayName?: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt?: string;
};

export function mapWallQuestion(
  doc: WallQuestionDocument,
  lang: string,
): WallQuestionResponse {
  return {
    id: doc.id,
    text: translateFieldHelper(doc.text, lang),
    expiresAt: doc.expiresAt.toISOString(),
    categoryId: doc.categoryId?.toString(),
    tags: doc.tags ?? [],
    status: doc.status,
    publishedAt: doc.publishedAt.toISOString(),
    publishedBy: doc.publishedBy?.toString(),
    archivedAt: doc.archivedAt?.toISOString(),
    replacedByQuestionId: doc.replacedByQuestionId?.toString(),
    featuredAnswerIds: (doc.featuredAnswerIds ?? []).map((id) => id.toString()),
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

export function mapWallAnswer(doc: WallAnswerDocument): WallAnswerResponse {
  const response: WallAnswerResponse = {
    id: doc.id,
    questionId: doc.questionId.toString(),
    text: doc.text,
    status: doc.status,
    submittedAt: doc.submittedAt.toISOString(),
    approvedAt: doc.approvedAt?.toISOString(),
    approvedBy: doc.approvedBy?.toString(),
    createdAt: doc.createdAt?.toISOString(),
  };

  const name = doc.displayName?.trim();
  if (name) {
    response.displayName = name;
  }

  return response;
}

export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}
