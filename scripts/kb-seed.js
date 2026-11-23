// Ingesta todos los .md y .txt de knowledge/. Idempotente: reemplaza documentos con el mismo título.
// Uso: npm run kb:seed
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingest } from '../server/modules/kb/kb.service.js';

const DIR = fileURLToPath(new URL('../knowledge/', import.meta.url));

async function main() {
  const files = (await readdir(DIR)).filter((f) => /\.(md|txt)$/i.test(f)).sort();
  for (const f of files) {
    const text = await readFile(join(DIR, f), 'utf8');
    const source = text.match(/^Fuente:\s*(.+)$/im)?.[1]?.trim() || 'Guía Rimay';
    const r = await ingest({ text, filename: f, source, replaceSameTitle: true });
    console.log(`✓ ${r.title}: ${r.chunks} fragmentos`);
  }
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
