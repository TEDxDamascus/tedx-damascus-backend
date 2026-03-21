export interface LocalizedText {
  en: string;
  ar: string;
}

export interface QuestionOptionResponse {
  id: string;
  orderIndex: number;
  label: LocalizedText;
}

export interface FormQuestionResponse {
  id: string;
  orderIndex: number;
  type: string;
  title: LocalizedText;
  helpText?: LocalizedText;
  isRequired: boolean;
  config: Record<string, unknown>;
  options: QuestionOptionResponse[];
}

export interface FormTemplateSummaryResponse {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  targetRole: string;
  status: string;
  publishedAt?: Date;
  starts_at?: Date;
  ends_at?: Date;
  expires_at?: Date;
  max_submissions?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FormTemplateSchemaResponse {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  targetRole: string;
  starts_at?: Date;
  ends_at?: Date;
  expires_at?: Date;
  max_submissions?: number;
  questions: FormQuestionResponse[];
}

export interface FormSubmissionAnswerResponse {
  questionId: string;
  value: unknown;
}

export interface FormSubmissionResponse {
  id: string;
  formTemplateId: string;
  userId: string;
  status: string;
  submittedAt: Date;
  answers: FormSubmissionAnswerResponse[];
}

