import { Router } from 'express';
import { requireStaff } from '../../common/auth-guard.js';
import { dashboard } from './stats.service.js';

export const statsRouter = Router();

statsRouter.get('/dashboard', requireStaff, async (_req, res) => res.json(await dashboard()));
