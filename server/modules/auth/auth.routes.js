import { Router } from 'express';
import { requireStaff } from '../../common/auth-guard.js';
import { login, listStaff, toUser } from './auth.service.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  res.json(await login(req.body?.email, req.body?.password));
});

authRouter.get('/me', requireStaff, (req, res) => res.json({ user: toUser(req.staff) }));

export const staffRouter = Router();

staffRouter.get('/', requireStaff, async (_req, res) => res.json(await listStaff()));
