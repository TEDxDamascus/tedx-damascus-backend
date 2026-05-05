import { Types } from 'mongoose';
import {
  FormTemplate,
  FormTemplateDocument,
} from '../entities/form-template.schema';
import { FormSubmissionDocument } from '../entities/form-submission.schema';
import {
  FormQuestionResponse,
  FormSubmissionAnswerResponse,
  FormSubmissionResponse,
  FormTemplateSchemaResponse,
  FormTemplateSummaryResponse,
  QuestionOptionResponse,
} from '../interfaces/form-responses.interface';

function toId(value: Types.ObjectId | undefined | null): string {
  return value ? value.toString() : '';
}

export function mapQuestionOption(option: {
  _id?: Types.ObjectId;
  orderIndex: number;
  label: { en: string; ar: string };
}): QuestionOptionResponse {
  return {
    id: toId(option._id),
    orderIndex: option.orderIndex,
    label: {
      en: option.label.en ?? '',
      ar: option.label.ar ?? '',
    },
  };
}

export function mapFormQuestion(question: {
  _id?: Types.ObjectId;
  orderIndex: number;
  type: string;
  title: { en: string; ar: string };
  helpText?: { en: string; ar: string };
  isRequired: boolean;
  config: Record<string, unknown>;
  options?: Array<{
    _id?: Types.ObjectId;
    orderIndex: number;
    label: { en: string; ar: string };
  }>;
}): FormQuestionResponse {
  const options = (question.options ?? [])
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((o) => mapQuestionOption(o));

  return {
    id: toId(question._id),
    orderIndex: question.orderIndex,
    type: question.type,
    title: {
      en: question.title.en ?? '',
      ar: question.title.ar ?? '',
    },
    helpText: question.helpText
      ? {
          en: question.helpText.en ?? '',
          ar: question.helpText.ar ?? '',
        }
      : undefined,
    isRequired: question.isRequired,
    config: question.config ?? {},
    options,
  };
}

export function mapFormTemplateToSchema(
  template: FormTemplateDocument,
): FormTemplateSchemaResponse {
  const t = template as FormTemplate & { _id: Types.ObjectId };
  return {
    id: toId(t._id),
    name: {
      en: t.name.en ?? '',
      ar: t.name.ar ?? '',
    },
    description: t.description
      ? {
          en: t.description.en ?? '',
          ar: t.description.ar ?? '',
        }
      : undefined,
    targetRole: t.targetRole,
    questions: (t.questions ?? [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) =>
        mapFormQuestion(q as unknown as Parameters<typeof mapFormQuestion>[0]),
      ),
  };
}

export function mapFormTemplateToSummary(
  template: FormTemplateDocument,
): FormTemplateSummaryResponse {
  const t = template as FormTemplate & { _id: Types.ObjectId };
  return {
    id: toId(t._id),
    name: {
      en: t.name.en ?? '',
      ar: t.name.ar ?? '',
    },
    description: t.description
      ? {
          en: t.description.en ?? '',
          ar: t.description.ar ?? '',
        }
      : undefined,
    targetRole: t.targetRole,
    status: t.status,
    publishedAt: t.publishedAt,
    createdAt: (t as any).createdAt,
    updatedAt: (t as any).updatedAt,
  };
}

export function mapSubmissionAnswer(answer: {
  questionId?: Types.ObjectId;
  value: unknown;
}): FormSubmissionAnswerResponse {
  return {
    questionId: toId(answer.questionId as Types.ObjectId),
    value: answer.value,
  };
}

export function mapFormSubmission(
  submission: FormSubmissionDocument,
): FormSubmissionResponse {
  const s = submission as any;
  return {
    id: toId(s._id),
    formTemplateId: toId(s.formTemplateId),
    userId: toId(s.userId),
    status: s.status,
    submittedAt: s.submittedAt,
    answers: (s.answers ?? []).map((a: any) => mapSubmissionAnswer(a)),
  };
}
