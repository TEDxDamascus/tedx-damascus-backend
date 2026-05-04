import { Types } from 'mongoose';
import { FormTemplateDocument } from '../entities/form-template.schema';
import {
  FormQuestion,
  QuestionType,
} from '../entities/form-question.schema';

interface QuestionWithId extends FormQuestion {
  _id?: Types.ObjectId;
}

type AnswerValue =
  | string
  | number
  | boolean
  | string[]
  | {
      start?: string | Date;
      end?: string | Date;
      url?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };

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

/** Draft save: option IDs must be valid; min/max selected not enforced. */
function validateCheckboxGroupDraft(
  value: unknown,
  question: QuestionWithId,
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
}

/** Draft save: must be string; min/max length not enforced. */
function validateShortTextDraft(value: unknown): void {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
}

function validateLongTextDraft(value: unknown): void {
  validateShortTextDraft(value);
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

function validatePhoneNumber(value: unknown): void {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
  const trimmed = value.trim();
  const plus963Pattern = /^\+963\d{9}$/;
  const localPattern = /^\d{10}$/;
  if (!plus963Pattern.test(trimmed) && !localPattern.test(trimmed)) {
    throw new Error(
      'Invalid phone number. Use +963 followed by 9 digits or 10-digit local number.',
    );
  }
}

function validateUrl(value: unknown): void {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('URL cannot be empty');
  }
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
  } catch {
    throw new Error('Invalid URL');
  }
}

function validateRating(value: unknown, config: Record<string, unknown>): void {
  const min = config.min as number | undefined;
  const max = config.max as number | undefined;
  if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
    throw new Error('Invalid rating configuration (min/max)');
  }
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : NaN;
  if (!Number.isFinite(num)) {
    throw new Error('Expected numeric rating');
  }
  if (!Number.isInteger(num)) {
    throw new Error('Rating must be an integer');
  }
  if (num < min || num > max) {
    throw new Error(`Rating must be between ${min} and ${max}`);
  }
}

function validateDateRange(
  value: unknown,
  config: Record<string, unknown>,
): void {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error('Expected object with start and end');
  }
  const { start, end } = value as {
    start?: string | Date;
    end?: string | Date;
  };
  const startDate =
    start instanceof Date ? start : start ? new Date(start) : undefined;
  const endDate =
    end instanceof Date ? end : end ? new Date(end) : undefined;
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date range');
  }
  if (startDate > endDate) {
    throw new Error('Start date must be before or equal to end date');
  }
  const minDate = config.min_date
    ? new Date(config.min_date as string)
    : undefined;
  const maxDate = config.max_date
    ? new Date(config.max_date as string)
    : undefined;
  if (minDate && (startDate < minDate || endDate < minDate)) {
    throw new Error(
      `Date range must start on or after ${minDate.toISOString()}`,
    );
  }
  if (maxDate && (startDate > maxDate || endDate > maxDate)) {
    throw new Error(
      `Date range must end on or before ${maxDate.toISOString()}`,
    );
  }
}

function validateFileUpload(value: unknown): void {
  validateUrl(value);
}

/**
 * Validates only answers that are present. Does not enforce isRequired.
 * Text min/max length and checkbox min/max counts are relaxed so users can save partial progress.
 */
export function validateDraftAnswers(
  template: FormTemplateDocument,
  answers: Record<string, unknown>,
): void {
  for (const question of template.questions) {
    const qId = (question as { _id?: { toString(): string } })._id?.toString();
    if (!qId) continue;
    const value = answers[qId];
    if (value === undefined || value === null || value === '') {
      continue;
    }
    const config = question.config || {};
    try {
      switch (question.type as QuestionType) {
        case 'short_text':
          validateShortTextDraft(value);
          break;
        case 'long_text':
          validateLongTextDraft(value);
          break;
        case 'single_choice':
          validateSingleChoice(value, question);
          break;
        case 'checkbox_group':
          validateCheckboxGroupDraft(value, question);
          break;
        case 'date':
          validateDate(value, config);
          break;
        case 'phone_number':
          validatePhoneNumber(value);
          break;
        case 'url':
          validateUrl(value);
          break;
        case 'rating':
          validateRating(value, config);
          break;
        case 'date_range':
          validateDateRange(value, config);
          break;
        case 'file_upload':
          validateFileUpload(value);
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

export function validateAnswers(
  template: FormTemplateDocument,
  // Use unknown here so DTOs can pass Record<string, unknown>;
  // runtime validators enforce the exact shape per question type.
  answers: Record<string, unknown>,
): void {
  for (const question of template.questions) {
    const qId = (question as { _id?: { toString(): string } })._id?.toString();
    if (!qId) continue;
      const value = answers[qId];
      if (
        question.isRequired &&
        (value === undefined ||
          value === null ||
          value === '')
      ) {
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
        case 'phone_number':
          validatePhoneNumber(value);
          break;
        case 'url':
          validateUrl(value);
          break;
        case 'rating':
          validateRating(value, config);
          break;
        case 'date_range':
          validateDateRange(value, config);
          break;
        case 'file_upload':
          validateFileUpload(value);
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
  // Accept unknown from DTO and rely on runtime validation
  // to ensure the shape matches the question type.
  value: unknown,
):
  | string
  | number
  | Date
  | boolean
  | Types.ObjectId
  | Types.ObjectId[]
  | {
      start: Date;
      end: Date;
    } {
  switch (question.type as QuestionType) {
    case 'date':
      return new Date(value as string);
    case 'single_choice':
      return new Types.ObjectId(value as string);
    case 'checkbox_group':
      return (value as string[]).map((id) => new Types.ObjectId(id));
    case 'rating': {
      const num =
        typeof value === 'number'
          ? value
          : typeof value === 'string'
          ? Number(value)
          : NaN;
      return num as number;
    }
    case 'date_range': {
      const obj = value as { start?: string | Date; end?: string | Date };
      const start =
        obj.start instanceof Date ? obj.start : new Date(obj.start as string);
      const end =
        obj.end instanceof Date ? obj.end : new Date(obj.end as string);
      return { start, end };
    }
    case 'file_upload': {
      if (typeof value !== 'string') {
        throw new Error('Expected URL string');
      }
      return value.trim();
    }
    default:
      return value as string | number | boolean;
  }
}
