import {
  containsBlockedWord,
  blockedWordsMatch,
  normalizeBlockedWordInput,
} from './check-blocked-words.util';

describe('check-blocked-words.util', () => {
  describe('containsBlockedWord', () => {
    it('matches Latin words case-insensitively in text', () => {
      expect(containsBlockedWord('This is SPAM content', undefined, ['spam'])).toBe(
        true,
      );
    });

    it('matches Arabic words as substring without case folding', () => {
      expect(
        containsBlockedWord('هذه كلمة محظورة في النص', undefined, [
          'كلمة محظورة',
        ]),
      ).toBe(true);
    });

    it('checks displayName', () => {
      expect(containsBlockedWord('clean text', 'badword', ['badword'])).toBe(
        true,
      );
    });

    it('returns false when no match', () => {
      expect(containsBlockedWord('clean answer', 'Sara', ['spam'])).toBe(false);
    });
  });

  describe('blockedWordsMatch', () => {
    it('treats Latin words as duplicates case-insensitively', () => {
      expect(blockedWordsMatch('Spam', 'spam')).toBe(true);
    });

    it('compares Arabic words exactly after trim', () => {
      expect(blockedWordsMatch('  كلمة  ', 'كلمة')).toBe(true);
    });
  });

  describe('normalizeBlockedWordInput', () => {
    it('trims whitespace', () => {
      expect(normalizeBlockedWordInput('  spam  ')).toBe('spam');
    });
  });
});
