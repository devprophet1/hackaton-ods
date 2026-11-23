import { Router } from 'express';
import { requireStaff } from '../../common/auth-guard.js';
import * as cases from './cases.service.js';

export const casesRouter = Router();
casesRouter.use(requireStaff);

casesRouter.get('/', async (req, res) => res.json(await cases.listCases(req.query.filter, req.staff.id)));
casesRouter.get('/:id', async (req, res) => res.json(await cases.getCase(req.params.id)));
casesRouter.post('/:id/contact-access', async (req, res) => res.json(await cases.contactAccess(req.params.id, req.staff)));
casesRouter.patch('/:id/assign', async (req, res) => res.json(await cases.assign(req.params.id, req.body?.staffId, req.staff)));
casesRouter.patch('/:id/status', async (req, res) => res.json(await cases.setStatus(req.params.id, req.body?.status, req.staff)));
casesRouter.post('/:id/notes', async (req, res) => res.json(await cases.addNote(req.params.id, req.body?.text, req.staff)));
