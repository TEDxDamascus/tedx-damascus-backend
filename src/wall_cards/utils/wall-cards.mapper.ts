import { Types } from 'mongoose';
import { WallAnswerDocument } from '../entities/wall-answer.entity';
import {
  WallQuestionDocument,
  WallQuestionText,
} from '../entities/wall-question.entity';

export type WallQuestionResponse = {
  id: string;
  text: WallQuestionText;
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

function mapWallQuestionText(text: WallQuestionText): WallQuestionText {
  const mapped: WallQuestionText = {};
  if (text?.en) {
    mapped.en = text.en;
  }
  if (text?.ar) {
    mapped.ar = text.ar;
  }
  return mapped;
}

export function mapWallQuestion(
  doc: WallQuestionDocument,
): WallQuestionResponse {
  return {
    id: doc.id,
    text: mapWallQuestionText(doc.text),
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
