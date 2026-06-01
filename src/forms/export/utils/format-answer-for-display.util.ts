import { Types } from 'mongoose';
import { QuestionType } from '../../entities/form-question.schema';
import { QuestionWithId } from '../../utils/form-question-tree.util';
import { escapeHtml } from './escape-html.util';

export type ExportLocale = 'en' | 'ar';

export const NOT_ANSWERED_LABEL: Record<ExportLocale, string> = {
  en: 'Not answered',
  ar: 'لم يتم الإجابة',
};

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function formatDateValue(value: Date | string, locale: ExportLocale): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function resolveOptionLabel(
  question: QuestionWithId,
  optionId: string,
  locale: ExportLocale,
): string {
  const option = question.options?.find(
    (o) => (o as { _id?: Types.ObjectId })._id?.toString() === optionId,
  );
  if (!option) {
    return optionId;
  }
  return option.label[locale] || option.label.en || optionId;
}

function parseFileNameFromUploadUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split('/').pop() ?? url;
    const match = segment.match(/^[0-9a-f-]{36}-(.+)$/i);
    return match ? decodeURIComponent(match[1]) : decodeURIComponent(segment);
  } catch {
    return url;
  }
}

function normalizeRawValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value;
  }
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      item instanceof Types.ObjectId ? item.toString() : item,
    );
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val instanceof Date) {
        result[key] = val;
      } else if (val instanceof Types.ObjectId) {
        result[key] = val.toString();
      } else {
        result[key] = val;
      }
    }
    return result;
  }
  return value;
}

function formatUrlLink(url: string): string {
  const escaped = escapeHtml(url);
  return `<a href="${escaped}" target="_blank" rel="noopener noreferrer">${escaped}</a>`;
}

export function formatAnswerForDisplay(
  question: QuestionWithId,
  rawValue: unknown,
  locale: ExportLocale,
): string {
  const value = normalizeRawValue(rawValue);

  if (isEmptyValue(value)) {
    return escapeHtml(NOT_ANSWERED_LABEL[locale]);
  }

  const config = question.config ?? {};

  switch (question.type as QuestionType) {
    case 'short_text':
    case 'long_text':
    case 'phone_number':
    case 'email':
    case 'number':
      return escapeHtml(String(value));

    case 'url':
      return formatUrlLink(String(value));

    case 'single_choice': {
      const optionId =
        value instanceof Types.ObjectId
          ? value.toString()
          : String(value);
      return escapeHtml(resolveOptionLabel(question, optionId, locale));
    }

    case 'checkbox_group': {
      const ids = Array.isArray(value) ? value : [value];
      const labels = ids.map((id) =>
        resolveOptionLabel(question, String(id), locale),
      );
      return escapeHtml(labels.join(', '));
    }

    case 'date':
      return escapeHtml(formatDateValue(value as Date | string, locale));

    case 'date_range': {
      const range = value as { start?: Date | string; end?: Date | string };
      const start = range.start
        ? formatDateValue(range.start, locale)
        : NOT_ANSWERED_LABEL[locale];
      const end = range.end
        ? formatDateValue(range.end, locale)
        : NOT_ANSWERED_LABEL[locale];
      return escapeHtml(`${start} – ${end}`);
    }

    case 'rating': {
      const num = typeof value === 'number' ? value : Number(value);
      const max = (config.max as number | undefined) ?? 5;
      return escapeHtml(`${num} / ${max}`);
    }

    case 'file_upload': {
      const url = String(value).trim();
      const filename = parseFileNameFromUploadUrl(url);
      const escapedUrl = escapeHtml(url);
      const escapedName = escapeHtml(filename);
      return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedName}</a>`;
    }

    case 'section':
      return escapeHtml(NOT_ANSWERED_LABEL[locale]);

    default:
      return escapeHtml(String(value));
  }
}
