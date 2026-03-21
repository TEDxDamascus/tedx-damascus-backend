import { Types } from 'mongoose';

/**
 * Fixed MongoDB ObjectId used for forms user flows (draft, submit, my-submission)
 * when auth is not wired yet, or when `x-user-id` is missing / not a valid ObjectId.
 *
 * Replace with JWT-derived user id once auth is complete.
 */
export const MOCK_FORMS_USER_OBJECT_ID = '507f1f77bcf86cd799439011' as const;

/**
 * Resolves the acting user id for forms endpoints.
 * - Valid `x-user-id` header → that user (normalized).
 * - Missing, empty, or invalid → {@link MOCK_FORMS_USER_OBJECT_ID}.
 */
export function resolveFormsUserId(headerValue?: string): string {
  const trimmed = headerValue?.trim();
  if (trimmed && Types.ObjectId.isValid(trimmed)) {
    return new Types.ObjectId(trimmed).toString();
  }
  return MOCK_FORMS_USER_OBJECT_ID;
}
