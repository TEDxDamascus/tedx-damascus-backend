import { Types } from 'mongoose';

export type ExtractableQuestion = {
  _id?: Types.ObjectId;
  type: string;
};

export type ExtractableAnswer = {
  questionId: Types.ObjectId;
  value: unknown;
};

export type SubmissionIdentity = {
  email: string;
  name?: string;
};

/**
 * Resolves email from the first answer whose question type is `email`.
 * Optionally snapshots name from the first `short_text` answer.
 * Returns null when no usable email is found (fail-fast at call site).
 */
export function extractSubmissionIdentity(
  questions: ExtractableQuestion[],
  answers: ExtractableAnswer[],
): SubmissionIdentity | null {
  const questionById = new Map<string, ExtractableQuestion>();
  for (const question of questions) {
    if (question._id) {
      questionById.set(question._id.toString(), question);
    }
  }

  let email: string | undefined;
  let name: string | undefined;

  for (const answer of answers) {
    const question = questionById.get(answer.questionId.toString());
    if (!question) {
      continue;
    }

    if (!email && question.type === 'email') {
      const value = normalizeString(answer.value);
      if (value) {
        email = value.toLowerCase();
      }
    }

    if (!name && question.type === 'short_text') {
      const value = normalizeString(answer.value);
      if (value) {
        name = value;
      }
    }
  }

  if (!email) {
    return null;
  }

  return name ? { email, name } : { email };
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
