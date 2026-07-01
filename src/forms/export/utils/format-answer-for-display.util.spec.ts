import { Types } from 'mongoose';
import { formatAnswerForDisplay } from './format-answer-for-display.util';
import { QuestionWithId } from '../../utils/form-question-tree.util';

function question(
  overrides: Partial<QuestionWithId> & { _id: Types.ObjectId },
): QuestionWithId {
  return {
    orderIndex: 0,
    type: 'short_text',
    title: { en: 'Title', ar: 'عنوان' },
    isRequired: false,
    config: {},
    options: [],
    ...overrides,
  };
}

describe('formatAnswerForDisplay', () => {
  it('returns not answered label for empty values', () => {
    const q = question({ _id: new Types.ObjectId(), type: 'short_text' });
    expect(formatAnswerForDisplay(q, undefined, 'en')).toBe('Not answered');
    expect(formatAnswerForDisplay(q, null, 'ar')).toBe('لم يتم الإجابة');
  });

  it('escapes HTML in plain text answers', () => {
    const q = question({ _id: new Types.ObjectId(), type: 'short_text' });
    expect(formatAnswerForDisplay(q, '<script>alert(1)</script>', 'en')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('resolves single_choice option label', () => {
    const optionId = new Types.ObjectId();
    const q = question({
      _id: new Types.ObjectId(),
      type: 'single_choice',
      options: [
        {
          _id: optionId,
          orderIndex: 0,
          label: { en: 'Yes', ar: 'نعم' },
        },
      ],
    });
    expect(formatAnswerForDisplay(q, optionId, 'en')).toBe('Yes');
    expect(formatAnswerForDisplay(q, optionId.toString(), 'ar')).toBe('نعم');
  });

  it('formats checkbox_group as comma-separated labels', () => {
    const opt1 = new Types.ObjectId();
    const opt2 = new Types.ObjectId();
    const q = question({
      _id: new Types.ObjectId(),
      type: 'checkbox_group',
      options: [
        { _id: opt1, orderIndex: 0, label: { en: 'A', ar: 'أ' } },
        { _id: opt2, orderIndex: 1, label: { en: 'B', ar: 'ب' } },
      ],
    });
    expect(formatAnswerForDisplay(q, [opt1, opt2], 'en')).toBe('A, B');
  });

  it('formats rating with max from config', () => {
    const q = question({
      _id: new Types.ObjectId(),
      type: 'rating',
      config: { min: 1, max: 10 },
    });
    expect(formatAnswerForDisplay(q, 7, 'en')).toBe('7 / 10');
  });

  it('renders file_upload as clickable link with filename', () => {
    const q = question({ _id: new Types.ObjectId(), type: 'file_upload' });
    const url =
      'https://cdn.example.com/users/u/forms/f/a1b2c3d4-e5f6-7890-abcd-ef1234567890-resume.pdf';
    const html = formatAnswerForDisplay(q, url, 'en');
    expect(html).toContain('href="https://cdn.example.com/users/u/forms/f/a1b2c3d4-e5f6-7890-abcd-ef1234567890-resume.pdf"');
    expect(html).toContain('>resume.pdf</a>');
  });

  it('formats url as clickable link', () => {
    const q = question({ _id: new Types.ObjectId(), type: 'url' });
    const html = formatAnswerForDisplay(q, 'https://example.com', 'en');
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('>https://example.com</a>');
  });

  it('formats date_range', () => {
    const q = question({ _id: new Types.ObjectId(), type: 'date_range' });
    const html = formatAnswerForDisplay(
      q,
      { start: '2025-01-01', end: '2025-01-31' },
      'en',
    );
    expect(html).toContain('–');
    expect(html).not.toContain('<script>');
  });
});
