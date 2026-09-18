export const PORTAL = 'admin' as const;

export interface PublicUser {
  _id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
}
