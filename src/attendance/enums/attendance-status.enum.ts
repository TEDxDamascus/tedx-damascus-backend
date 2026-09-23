export const ATTENDANCE_STATUSES = [
  'not_sent',
  'sent',
  'failed',
  'revoked',
  'attended',
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export enum AttendanceStatusEnum {
  NOT_SENT = 'not_sent',
  SENT = 'sent',
  FAILED = 'failed',
  REVOKED = 'revoked',
  ATTENDED = 'attended',
}
