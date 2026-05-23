import { Types } from 'mongoose';
import { FormTemplateDocument } from '../entities/form-template.schema';
import { FormQuestion } from '../entities/form-question.schema';
import {
  AnswerValidationError,
  normalizeAnswerValue,
  validateAnswers,
  validateDraftAnswers,
} from './answer.validator';

const EMAIL_Q_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const NUMBER_Q_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';

function question(
  id: string,
  type: FormQuestion['type'],
  isRequired = false,
): FormQuestion & { _id: Types.ObjectId } {
  return {
    _id: new Types.ObjectId(id),
    orderIndex: 0,
    type,
    title: { en: 'Q', ar: '' },
    isRequired,
    config: {},
    options: [],
  };
}

function templateWith(
  questions: (FormQuestion & { _id: Types.ObjectId })[],
): FormTemplateDocument {
  return { questions } as unknown as FormTemplateDocument;
}

describe('answer.validator email and number', () => {
  const template = templateWith([
    question(EMAIL_Q_ID, 'email', true),
    question(NUMBER_Q_ID, 'number', true),
  ]);

  describe('validateAnswers', () => {
    it('accepts valid email and number', () => {
      expect(() =>
        validateAnswers(template, {
          [EMAIL_Q_ID]: 'user@example.com',
          [NUMBER_Q_ID]: 42,
        }),
      ).not.toThrow();
    });

    it('accepts numeric string for number', () => {
      expect(() =>
        validateAnswers(template, {
          [EMAIL_Q_ID]: 'user@example.com',
          [NUMBER_Q_ID]: '-3.5',
        }),
      ).not.toThrow();
    });

    it('rejects invalid email', () => {
      expect(() =>
        validateAnswers(template, {
          [EMAIL_Q_ID]: 'not-an-email',
          [NUMBER_Q_ID]: 10,
        }),
      ).toThrow(AnswerValidationError);
    });

    it('rejects number with extra characters', () => {
      expect(() =>
        validateAnswers(template, {
          [EMAIL_Q_ID]: 'user@example.com',
          [NUMBER_Q_ID]: '12abc',
        }),
      ).toThrow(AnswerValidationError);
    });

    it('rejects number with whitespace', () => {
      expect(() =>
        validateAnswers(template, {
          [EMAIL_Q_ID]: 'user@example.com',
          [NUMBER_Q_ID]: ' 5 ',
        }),
      ).toThrow(AnswerValidationError);
    });

    it('rejects boolean as number', () => {
      expect(() =>
        validateAnswers(template, {
          [EMAIL_Q_ID]: 'user@example.com',
          [NUMBER_Q_ID]: true,
        }),
      ).toThrow(AnswerValidationError);
    });

    it('requires answers when isRequired', () => {
      expect(() =>
        validateAnswers(template, {
          [EMAIL_Q_ID]: 'user@example.com',
        }),
      ).toThrow(AnswerValidationError);
    });
  });

  describe('validateDraftAnswers', () => {
    it('validates present email and number the same as submit', () => {
      expect(() =>
        validateDraftAnswers(template, {
          [NUMBER_Q_ID]: '10',
        }),
      ).not.toThrow();

      expect(() =>
        validateDraftAnswers(template, {
          [NUMBER_Q_ID]: '12abc',
        }),
      ).toThrow(AnswerValidationError);
    });
  });

  describe('normalizeAnswerValue', () => {
    it('trims email and coerces number', () => {
      const emailQ = question(EMAIL_Q_ID, 'email');
      const numberQ = question(NUMBER_Q_ID, 'number');

      expect(
        normalizeAnswerValue(emailQ, '  user@example.com  '),
      ).toBe('user@example.com');
      expect(normalizeAnswerValue(numberQ, '10')).toBe(10);
      expect(normalizeAnswerValue(numberQ, -3.5)).toBe(-3.5);
    });
  });
});
