const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

export function normalizeTags(tags?: string[]): string[] {
  if (!tags?.length) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tags) {
    const tag = raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
    if (!tag || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    result.push(tag);
    if (result.length >= MAX_TAGS) {
      break;
    }
  }

  return result;
}
