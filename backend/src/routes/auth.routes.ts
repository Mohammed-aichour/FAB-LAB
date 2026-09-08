import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, signAccessToken } from '../middleware/auth';
import { readEntity } from '../services/json-store';
import type { AuthenticatedRequest, AuthenticatedUser } from '../types/auth';
import { rateLimit } from '../middleware/rate-limit';

const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(256) });

router.post('/login', rateLimit(10), async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Identifiants invalides.' });

  const users = readEntity<AuthenticatedUser[]>('users');
  const user = users.find((candidate) => candidate.email.toLowerCase() === parsed.data.email.toLowerCase());
  const credential = readEntity<{ userId: string; hash: string }[]>('credentials').find(c => c.userId === String(user?.id));
  if (!user || !credential || user.status !== 'Actif' || !(await bcrypt.compare(parsed.data.password, credential.hash))) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  return res.json({ token: signAccessToken(user), user });
});

router.get('/me', authenticate, (req: AuthenticatedRequest, res) => res.json({ user: req.user }));

export default router;
