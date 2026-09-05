export const ATTENDANCE_STATUSES = [
  'accepted',
  'invited',
  'attended',
  'revoked',
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export enum AttendanceStatusEnum {
  ACCEPTED = 'accepted',
  INVITED = 'invited',
  ATTENDED = 'attended',
  REVOKED = 'revoked',
}
