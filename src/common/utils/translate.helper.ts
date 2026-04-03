export function translateFieldHelper(
  field: { en: string; ar: string },
  lang: string,
  fallback = 'en',
) {
  return field?.[lang] ?? field?.[fallback] ?? '';
}
