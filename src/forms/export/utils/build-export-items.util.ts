import { BadRequestException } from '@nestjs/common';
import {
  getQuestionId,
  QuestionWithId,
  sortQuestionsSiblingOrder,
} from '../../utils/form-question-tree.util';
import {
  ExportLocale,
  formatAnswerForDisplay,
} from './format-answer-for-display.util';
import { escapeHtml } from './escape-html.util';

export type ExportItem =
  | { kind: 'section'; title: string }
  | { kind: 'question'; label: string; answerHtml: string };

export function buildExportItems(
  questions: QuestionWithId[],
  questionIds: string[],
  answersByQuestionId: Record<string, unknown>,
  locale: ExportLocale,
): ExportItem[] {
  const selectedIds = new Set(questionIds);

  for (const id of questionIds) {
    const found = questions.some((q) => getQuestionId(q) === id);
    if (!found) {
      throw new BadRequestException(`Question ${id} not found on form`);
    }
  }

  const filtered = questions.filter((q) => {
    const qId = getQuestionId(q);
    return qId && selectedIds.has(qId);
  });

  const sorted = sortQuestionsSiblingOrder(filtered);

  return sorted.map((question) => {
    const qId = getQuestionId(question)!;
    const title =
      question.title[locale] || question.title.en || question.title.ar || '';

    if (question.type === 'section') {
      return { kind: 'section' as const, title };
    }

    return {
      kind: 'question' as const,
      label: title,
      answerHtml: formatAnswerForDisplay(
        question,
        answersByQuestionId[qId],
        locale,
      ),
    };
  });
}

export function renderExportItemsHtml(items: ExportItem[]): string {
  return items
    .map((item) => {
      if (item.kind === 'section') {
        return `<div class="section"><h2>${escapeHtml(item.title)}</h2></div>`;
      }
      return `<div class="qa">
  <div class="question">${escapeHtml(item.label)}</div>
  <div class="answer">${item.answerHtml}</div>
</div>`;
    })
    .join('\n');
}
