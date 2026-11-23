import express from 'express';
import { errorHandler } from './common/errors.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { ragRouter } from './modules/rag/rag.routes.js';
import { authRouter, staffRouter } from './modules/auth/auth.routes.js';
import { casesRouter } from './modules/cases/cases.routes.js';
import { statsRouter } from './modules/stats/stats.routes.js';
import { kbRouter } from './modules/kb/kb.routes.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

const api = express.Router();
api.get('/health', (_req, res) => res.json({ status: 'ok' }));
api.use('/reports', reportsRouter);
api.use('/rag', ragRouter);
api.use('/auth', authRouter);
api.use('/staff', staffRouter);
api.use('/cases', casesRouter);
api.use('/stats', statsRouter);
api.use('/kb', kbRouter);
api.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

app.use('/api', api);
app.use(errorHandler);

export default app;
