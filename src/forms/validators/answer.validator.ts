import { Types } from 'mongoose';
import { FormTemplateDocument } from '../entities/form-template.schema';
import {
  FormQuestion,
  QuestionType,
} from '../entities/form-question.schema';

interface QuestionWithId extends FormQuestion {
  _id?: Types.ObjectId;
}

export class AnswerValidationError extends Error {
  constructor(
    message: string,
    public readonly questionId: string,
  ) {
    super(message);
    this.name = 'AnswerValidationError';
  }
}

function validateShortText(value: unknown, config: Record<string, unknown>): void {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
  const minLength = config.min_length as number | undefined;
  const maxLength = config.max_length as number | undefined;
  if (minLength !== undefined && value.length < minLength) {
    throw new Error(`Minimum length is ${minLength}`);
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new Error(`Maximum length is ${maxLength}`);
  }
}

function validateLongText(value: unknown, config: Record<string, unknown>): void {
  validateShortText(value, config);
}

function validateSingleChoice(
  value: unknown,
  question: QuestionWithId,
): void {
  if (typeof value !== 'string') {
    throw new Error('Expected option ID string');
  }
  const optionIds = question.options.map((o) =>
    (o as { _id?: { toString(): string } })._id?.toString(),
  );
  if (!optionIds.includes(value)) {
    throw new Error('Invalid option selected');
  }
}

function validateCheckboxGroup(
  value: unknown,
  question: QuestionWithId,
  config: Record<string, unknown>,
): void {
  const arr = Array.isArray(value) ? value : [value];
  if (!arr.every((v) => typeof v === 'string')) {
    throw new Error('Expected array of option ID strings');
  }
  const optionIds = question.options.map((o) =>
    (o as { _id?: { toString(): string } })._id?.toString(),
  );
  for (const v of arr) {
    if (!optionIds.includes(v as string)) {
      throw new Error('Invalid option selected');
    }
  }
  const minSelected = config.min_selected as number | undefined;
  const maxSelected = config.max_selected as number | undefined;
  if (minSelected !== undefined && arr.length < minSelected) {
    throw new Error(`Select at least ${minSelected} options`);
  }
  if (maxSelected !== undefined && arr.length > maxSelected) {
    throw new Error(`Select at most ${maxSelected} options`);
  }
}

function validateDate(value: unknown, config: Record<string, unknown>): void {
  const date = value instanceof Date ? value : new Date(value as string);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  const minDate = config.min_date
    ? new Date(config.min_date as string)
    : undefined;
  const maxDate = config.max_date
    ? new Date(config.max_date as string)
    : undefined;
  if (minDate && date < minDate) {
    throw new Error(`Date must be on or after ${minDate.toISOString()}`);
  }
  if (maxDate && date > maxDate) {
    throw new Error(`Date must be on or before ${maxDate.toISOString()}`);
  }
}

export function validateAnswers(
  template: FormTemplateDocument,
  answers: Record<string, string | string[] | boolean>,
): void {
  for (const question of template.questions) {
    const qId = (question as { _id?: { toString(): string } })._id?.toString();
    if (!qId) continue;
    const value = answers[qId];
    if (question.isRequired && (value === undefined || value === null || value === '')) {
      throw new AnswerValidationError('This question is required', qId);
    }
    if (value === undefined || value === null || value === '') {
      continue;
    }
    const config = question.config || {};
    try {
      switch (question.type as QuestionType) {
        case 'short_text':
          validateShortText(value, config);
          break;
        case 'long_text':
          validateLongText(value, config);
          break;
        case 'single_choice':
          validateSingleChoice(value, question);
          break;
        case 'checkbox_group':
          validateCheckboxGroup(value, question, config);
          break;
        case 'date':
          validateDate(value, config);
          break;
        default:
          throw new Error(`Unknown question type: ${question.type}`);
      }
    } catch (err) {
      throw new AnswerValidationError(
        err instanceof Error ? err.message : 'Invalid answer',
        qId,
      );
    }
  }
}

export function normalizeAnswerValue(
  question: QuestionWithId,
  value: string | string[] | boolean,
): string | Date | boolean | Types.ObjectId | Types.ObjectId[] {
  switch (question.type as QuestionType) {
    case 'date':
      return new Date(value as string);
    case 'single_choice':
      return new Types.ObjectId(value as string);
    case 'checkbox_group':
      return (value as string[]).map((id) => new Types.ObjectId(id));
    default:
      return value as string | boolean;
  }
}
