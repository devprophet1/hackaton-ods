import { Router } from 'express';
import { chat } from './rag.service.js';

export const ragRouter = Router();

// No se guarda ni se registra el texto de la pregunta.
ragRouter.post('/chat', async (req, res) => {
  res.json(await chat(req.body?.message));
});
