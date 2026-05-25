import { Types } from 'mongoose';

/**
 * Used when wall-cards admin routes run without JWT (testing only).
 * Re-enable guards and use req.user.id before production.
 */
export const MOCK_WALL_CARDS_ADMIN_OBJECT_ID =
  '507f1f77bcf86cd799439011' as const;

export function resolveWallCardsAdminUserId(
  headerValue?: string,
): string {
  const trimmed = headerValue?.trim();
  if (trimmed && Types.ObjectId.isValid(trimmed)) {
    return new Types.ObjectId(trimmed).toString();
  }
  return MOCK_WALL_CARDS_ADMIN_OBJECT_ID;
}
