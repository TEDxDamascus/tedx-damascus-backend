import slugify from 'slugify';

type Locale = 'ar' | 'en';

type LocalizedValue = {
  ar?: string;
  en?: string;
};

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670]/g;
const NON_ARABIC_SLUG_CHARS_REGEX = /[^\u0621-\u063A\u0641-\u064A0-9\s-]/g;
const MULTIPLE_SPACES_REGEX = /\s+/g;
const MULTIPLE_DASHES_REGEX = /-+/g;

function slugifyArabic(value: string): string {
  return value
    .normalize('NFKD')
    .replace(ARABIC_DIACRITICS_REGEX, '')
    .replace(NON_ARABIC_SLUG_CHARS_REGEX, ' ')
    .trim()
    .replace(MULTIPLE_SPACES_REGEX, '-')
    .replace(MULTIPLE_DASHES_REGEX, '-')
    .toLowerCase();
}

function slugifyEnglish(value: string): string {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function generateLocaleSlug(value: string, locale: Locale): string {
  if (!value) {
    return '';
  }

  return locale === 'ar' ? slugifyArabic(value) : slugifyEnglish(value);
}

export function buildLocalizedSlug(
  title: LocalizedValue,
  existingSlug?: LocalizedValue,
): { ar: string; en: string } {
  return {
    ar: existingSlug?.ar?.trim() || generateLocaleSlug(title.ar ?? '', 'ar'),
    en: existingSlug?.en?.trim() || generateLocaleSlug(title.en ?? '', 'en'),
  };
}
