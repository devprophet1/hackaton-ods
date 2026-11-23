// Prueba la búsqueda de la base de conocimiento sin pasar por la API.
// Uso: npm run kb:test -- "¿necesito un abogado para denunciar?"
import { search } from '../server/modules/kb/kb.service.js';

const query = process.argv.slice(2).join(' ').trim() || '¿necesito un abogado para denunciar?';

try {
  const hits = await search(query);
  console.log(`Pregunta: ${query}\n`);
  if (!hits.length) console.log('Sin fragmentos. ¿Ejecutaste npm run kb:seed?');
  hits.forEach((h, i) => {
    console.log(`${i + 1}. [${h.similarity.toFixed(3)}] ${h.document_title} (${h.source})`);
    console.log(`   ${h.content.replace(/\s+/g, ' ').slice(0, 200)}…\n`);
  });
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
}
