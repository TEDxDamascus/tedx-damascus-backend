export function translateFieldHelper(
  field: { en?: string; ar?: string } | undefined | null,
  lang: string,
  fallback = 'en',
) {
  return field?.[lang] ?? field?.[fallback] ?? field?.en ?? field?.ar ?? '';
}
