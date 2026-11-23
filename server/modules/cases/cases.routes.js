import { Router } from 'express';
import { requireStaff } from '../../common/auth-guard.js';
import * as cases from './cases.service.js';

export const casesRouter = Router();
casesRouter.use(requireStaff);

casesRouter.get('/', async (req, res) => res.json(await cases.listCases(req.query.filter)));
casesRouter.get('/:id', async (req, res) => res.json(await cases.getCase(req.params.id)));
casesRouter.post('/:id/contact-access', async (req, res) => res.json(await cases.contactAccess(req.params.id, req.staff)));
// Estado + persona de contacto + derivación, en un solo evento del historial.
casesRouter.patch('/:id/follow-up', async (req, res) => res.json(await cases.updateFollowUp(req.params.id, req.body, req.staff)));
casesRouter.post('/:id/notes', async (req, res) => res.json(await cases.addNote(req.params.id, req.body?.text, req.staff)));
// Análisis de apoyo con IA: bajo demanda, no se guarda.
casesRouter.post('/:id/analysis', async (req, res) => res.json(await cases.analyze(req.params.id)));
