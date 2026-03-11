export type JwtUserPayload = {
  sub: string;
  email: string;
  role: string;
  permissions?: string[];
};
