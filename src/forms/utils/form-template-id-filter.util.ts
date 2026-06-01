import { Types } from 'mongoose';

/**
 * Matches `formTemplateId` whether stored as ObjectId or as a legacy string
 * (some submissions were saved with a raw string before normalization).
 */
export function formTemplateIdFilter(formId: string): {
  formTemplateId: { $in: [Types.ObjectId, string] };
} {
  return {
    formTemplateId: { $in: [new Types.ObjectId(formId), formId] },
  };
}

export function toFormTemplateObjectId(formId: string): Types.ObjectId {
  return new Types.ObjectId(formId);
}
