import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { buildExportItems } from './build-export-items.util';
import { QuestionWithId } from '../../utils/form-question-tree.util';

const sectionA = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const sectionB = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const questionQ = 'cccccccccccccccccccccccc';
const questionR = 'dddddddddddddddddddddddd';

function makeQuestions(): QuestionWithId[] {
  return [
    {
      _id: new Types.ObjectId(sectionA),
      orderIndex: 0,
      type: 'section',
      title: { en: 'Section A', ar: 'قسم أ' },
      isRequired: false,
      config: {},
      options: [],
    },
    {
      _id: new Types.ObjectId(questionQ),
      orderIndex: 0,
      type: 'short_text',
      parentId: new Types.ObjectId(sectionA),
      title: { en: 'Question Q', ar: 'سؤال' },
      isRequired: true,
      config: {},
      options: [],
    },
    {
      _id: new Types.ObjectId(sectionB),
      orderIndex: 1,
      type: 'section',
      title: { en: 'Section B', ar: 'قسم ب' },
      isRequired: false,
      config: {},
      options: [],
    },
    {
      _id: new Types.ObjectId(questionR),
      orderIndex: 0,
      type: 'short_text',
      parentId: new Types.ObjectId(sectionB),
      title: { en: 'Question R', ar: 'سؤال ب' },
      isRequired: false,
      config: {},
      options: [],
    },
  ];
}

describe('buildExportItems', () => {
  it('builds flat list in form order, not request order', () => {
    const questions = makeQuestions();
    const items = buildExportItems(
      questions,
      [questionR, questionQ],
      { [questionQ]: 'Answer Q', [questionR]: 'Answer R' },
      'en',
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      kind: 'question',
      label: 'Question Q',
      answerHtml: 'Answer Q',
    });
    expect(items[1]).toEqual({
      kind: 'question',
      label: 'Question R',
      answerHtml: 'Answer R',
    });
  });

  it('includes section header only when section id is selected', () => {
    const questions = makeQuestions();
    const items = buildExportItems(
      questions,
      [sectionA, questionQ],
      { [questionQ]: 'Answer Q' },
      'en',
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ kind: 'section', title: 'Section A' });
    expect(items[1].kind).toBe('question');
  });

  it('does not auto-include parent sections (Option A)', () => {
    const questions = makeQuestions();
    const items = buildExportItems(
      questions,
      [questionQ],
      { [questionQ]: 'Answer Q' },
      'en',
    );
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('question');
  });

  it('throws when question id is not on form', () => {
    const questions = makeQuestions();
    expect(() =>
      buildExportItems(
        questions,
        ['eeeeeeeeeeeeeeeeeeeeeeee'],
        {},
        'en',
      ),
    ).toThrow(BadRequestException);
  });
});
