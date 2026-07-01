import { Types } from 'mongoose';

/**
 * Placeholder user id for anonymous form flows until JWT auth is wired.
 * A new ObjectId is generated per call so rows do not collide on the unique
 * (formTemplateId, userId) index.
 */
export function generateAnonymousSubmissionUserId(): Types.ObjectId {
  return new Types.ObjectId();
}
