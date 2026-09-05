import { Types } from 'mongoose';
import { extractSubmissionIdentity } from './extract-submission-email.util';

describe('extractSubmissionIdentity', () => {
  const emailQuestionId = new Types.ObjectId();
  const nameQuestionId = new Types.ObjectId();
  const otherQuestionId = new Types.ObjectId();

  const questions = [
    { _id: emailQuestionId, type: 'email' },
    { _id: nameQuestionId, type: 'short_text' },
    { _id: otherQuestionId, type: 'long_text' },
  ];

  it('extracts email and optional name', () => {
    const result = extractSubmissionIdentity(questions, [
      { questionId: nameQuestionId, value: ' Ada Lovelace ' },
      { questionId: emailQuestionId, value: ' Ada@Example.com ' },
    ]);

    expect(result).toEqual({
      email: 'ada@example.com',
      name: 'Ada Lovelace',
    });
  });

  it('returns null when email is missing', () => {
    const result = extractSubmissionIdentity(questions, [
      { questionId: nameQuestionId, value: 'No Email' },
    ]);

    expect(result).toBeNull();
  });

  it('returns email only when name is absent', () => {
    const result = extractSubmissionIdentity(questions, [
      { questionId: emailQuestionId, value: 'only@example.com' },
      { questionId: otherQuestionId, value: 'bio' },
    ]);

    expect(result).toEqual({ email: 'only@example.com' });
  });
});
