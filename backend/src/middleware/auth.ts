import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { readEntity } from '../services/json-store';
import type { AuthenticatedRequest, AuthenticatedUser } from '../types/auth';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET doit contenir au moins 32 caractères.');
  }
  return secret;
};

export function signAccessToken(user: AuthenticatedUser): string {
  return jwt.sign({ sub: String(user.id), email: user.email }, getJwtSecret(), { expiresIn: '8h' });
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentification requise.' });
    const decoded = jwt.verify(header.slice(7), getJwtSecret()) as { sub?: string };
    const users = readEntity<AuthenticatedUser[]>('users');
    const user = users.find((candidate) => String(candidate.id) === decoded.sub && candidate.status === 'Actif');
    if (!user) return res.status(401).json({ error: 'Session invalide ou utilisateur désactivé.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session invalide ou expirée.' });
  }
}

export const requireRoles = (...roles: string[]) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Vous ne disposez pas des autorisations nécessaires.' });
  }
  next();
};
