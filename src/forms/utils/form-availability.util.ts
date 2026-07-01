import { ForbiddenException, GoneException } from '@nestjs/common';

export type FormAvailabilityFields = {
  status: string;
  starts_at?: Date | null;
  ends_at?: Date | null;
  expires_at?: Date | null;
  max_submissions?: number | null;
};

/**
 * Enforces publish state, submission window, expiry, and optional cap.
 * Order: not published → not yet open → expired (410) → window closed (403) → cap.
 */
export function throwIfFormNotAcceptingSubmission(
  template: FormAvailabilityFields,
  submissionCount: number,
  now: Date = new Date(),
): void {
  if (template.status !== 'Published') {
    throw new ForbiddenException('Form is not published');
  }

  if (template.starts_at && now < template.starts_at) {
    throw new ForbiddenException('Form is not yet open.');
  }

  if (template.expires_at && now >= template.expires_at) {
    throw new GoneException('Form has expired.');
  }

  if (template.ends_at && now > template.ends_at) {
    throw new ForbiddenException('Form submission window is closed.');
  }

  if (
    template.max_submissions != null &&
    submissionCount >= template.max_submissions
  ) {
    throw new ForbiddenException('Submission limit reached.');
  }
}

/**
 * Submission cap only (race guard before insert). Assumes template already loaded.
 */
export function throwIfSubmissionCapReached(
  template: Pick<FormAvailabilityFields, 'max_submissions'>,
  submissionCount: number,
): void {
  if (
    template.max_submissions != null &&
    submissionCount >= template.max_submissions
  ) {
    throw new ForbiddenException('Submission limit reached.');
  }
}
