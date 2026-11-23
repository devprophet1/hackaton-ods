import { Router } from 'express';
import multer from 'multer';
import { requireStaff } from '../../common/auth-guard.js';
import { HttpError } from '../../common/errors.js';
import { listDocuments, ingest, search } from './kb.service.js';

// 4 MB: por debajo del límite de 4,5 MB del cuerpo en Vercel.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

export const kbRouter = Router();
kbRouter.use(requireStaff);

kbRouter.get('/documents', async (_req, res) => res.json(await listDocuments()));

kbRouter.post('/documents', upload.single('file'), async (req, res) => {
  const f = req.file;
  if (!f) throw new HttpError(400, 'Elige un archivo.');
  // TODO: PDF queda fuera para mantenerlo simple; solo .md y .txt.
  if (!/\.(md|txt)$/i.test(f.originalname)) throw new HttpError(400, 'Por ahora solo se aceptan archivos .md o .txt.');
  const result = await ingest({
    text: f.buffer.toString('utf8'),
    filename: f.originalname,
    source: `Subido por ${req.staff.full_name}`,
    uploadedBy: req.staff.id,
  });
  res.status(201).json(result);
});

kbRouter.post('/search', async (req, res) => res.json(await search(req.body?.query)));
