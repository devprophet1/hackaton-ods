import { Router } from 'express';
import { createReport } from './reports.service.js';

export const reportsRouter = Router();

// No registrar el cuerpo de esta petición.
reportsRouter.post('/', async (req, res) => {
  res.status(201).json(await createReport(req.body));
});
