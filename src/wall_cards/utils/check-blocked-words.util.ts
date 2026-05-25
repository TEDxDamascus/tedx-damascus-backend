const LATIN_LETTERS = /[a-zA-Z]/;

function containsLatinLetters(value: string): boolean {
  return LATIN_LETTERS.test(value);
}

function haystackContainsNeedle(haystack: string, needle: string): boolean {
  const trimmedHaystack = haystack.trim();
  const trimmedNeedle = needle.trim();

  if (!trimmedNeedle) {
    return false;
  }

  if (containsLatinLetters(trimmedNeedle)) {
    return trimmedHaystack.toLowerCase().includes(trimmedNeedle.toLowerCase());
  }

  return trimmedHaystack.includes(trimmedNeedle);
}

export function containsBlockedWord(
  text: string,
  displayName: string | undefined,
  blockedWords: string[],
): boolean {
  const fields = [text, displayName].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const field of fields) {
    for (const word of blockedWords) {
      if (haystackContainsNeedle(field, word)) {
        return true;
      }
    }
  }

  return false;
}

export function normalizeBlockedWordInput(word: string): string {
  return word.trim();
}

export function blockedWordsMatch(a: string, b: string): boolean {
  const left = a.trim();
  const right = b.trim();

  if (containsLatinLetters(left) || containsLatinLetters(right)) {
    return left.toLowerCase() === right.toLowerCase();
  }

  return left === right;
}
