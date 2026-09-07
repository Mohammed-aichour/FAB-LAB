import type { Request } from 'express';

export interface AuthenticatedUser {
  id: number | string;
  email: string;
  name: string;
  role: string;
  status: string;
  initials?: string;
  color?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
