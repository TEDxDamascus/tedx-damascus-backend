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
  parentId: string | null;
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
  slug?: LocalizedText;
  shareable_url?: LocalizedText;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Admin GET /forms/:id — summary metadata plus all questions for pre-publish review. */
export interface FormTemplateAdminDetailResponse
  extends FormTemplateSummaryResponse {
  questions: FormQuestionResponse[];
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
  /** Present only when status is submitted. */
  submittedAt?: Date;
  answers: FormSubmissionAnswerResponse[];
}
