import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  assertCannotDemoteSectionWithChildren,
  assertSectionConstraints,
  assertValidParent,
  hasChildren,
  QuestionWithId,
  rerootChildrenOnSectionDelete,
  validateQuestionTree,
  wouldCreateCycle,
} from './form-question-tree.util';

function section(id: string, parentId?: string): QuestionWithId {
  return {
    _id: new Types.ObjectId(id),
    orderIndex: 0,
    type: 'section',
    parentId: parentId ? new Types.ObjectId(parentId) : undefined,
    title: { en: 'Section', ar: '' },
    isRequired: false,
    config: {},
    options: [],
  };
}

function shortText(
  id: string,
  parentId?: string,
): QuestionWithId {
  return {
    _id: new Types.ObjectId(id),
    orderIndex: 0,
    type: 'short_text',
    parentId: parentId ? new Types.ObjectId(parentId) : undefined,
    title: { en: 'Q', ar: '' },
    isRequired: false,
    config: {},
    options: [],
  };
}

describe('form-question-tree.util', () => {
  const sectionA = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  const sectionB = 'bbbbbbbbbbbbbbbbbbbbbbbb';
  const questionQ = 'cccccccccccccccccccccccc';

  describe('assertValidParent', () => {
    it('allows null parent', () => {
      expect(() =>
        assertValidParent([section(sectionA)], null),
      ).not.toThrow();
    });

    it('rejects missing parent', () => {
      expect(() =>
        assertValidParent([], sectionA),
      ).toThrow(BadRequestException);
    });

    it('rejects non-section parent', () => {
      expect(() =>
        assertValidParent([shortText(sectionA)], sectionA),
      ).toThrow('Parent must be a section');
    });

    it('detects cycle when self is ancestor of proposed parent', () => {
      const questions = [
        section(sectionA),
        section(sectionB, sectionA),
      ];
      expect(wouldCreateCycle(questions, sectionA, sectionB)).toBe(true);
      expect(() =>
        assertValidParent(questions, sectionB, sectionA),
      ).toThrow('would create a cycle');
    });
  });

  describe('rerootChildrenOnSectionDelete', () => {
    it('re-parents direct children to deleted section parent', () => {
      const root = 'dddddddddddddddddddddddd';
      const questions = [
        section(root),
        section(sectionA, root),
        shortText(questionQ, sectionA),
      ];
      rerootChildrenOnSectionDelete(
        questions,
        sectionA,
        new Types.ObjectId(root),
      );
      expect(questions[2].parentId?.toString()).toBe(root);
    });

    it('re-parents direct children to root when deleted section was root', () => {
      const questions = [
        section(sectionA),
        shortText(questionQ, sectionA),
      ];
      rerootChildrenOnSectionDelete(questions, sectionA, null);
      expect(questions[1].parentId).toBeUndefined();
    });
  });

  describe('assertCannotDemoteSectionWithChildren', () => {
    it('blocks type change when section has children', () => {
      const questions = [section(sectionA), shortText(questionQ, sectionA)];
      expect(() =>
        assertCannotDemoteSectionWithChildren(
          questions,
          sectionA,
          'short_text',
        ),
      ).toThrow(BadRequestException);
      expect(hasChildren(questions, sectionA)).toBe(true);
    });
  });

  describe('assertSectionConstraints', () => {
    it('rejects required section', () => {
      expect(() =>
        assertSectionConstraints('section', true, []),
      ).toThrow('cannot be required');
    });
  });

  describe('validateQuestionTree', () => {
    it('passes valid tree', () => {
      expect(() =>
        validateQuestionTree([
          section(sectionA),
          shortText(questionQ, sectionA),
        ]),
      ).not.toThrow();
    });

    it('fails on dangling parentId', () => {
      expect(() =>
        validateQuestionTree([shortText(questionQ, sectionA)]),
      ).toThrow('missing parent');
    });
  });
});
