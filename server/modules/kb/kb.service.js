import { db, check } from '../../common/supabase.js';
import { embed } from '../../common/gemini.js';
import { HttpError } from '../../common/errors.js';

const SIZE = 800;
const OVERLAP = 100;

// Divide en fragmentos de ~800 caracteres con solapamiento de 100, respetando párrafos.
export function chunkText(text) {
  const paras = text.replace(/\r/g, '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let cur = '';
  const push = () => { if (cur.trim()) chunks.push(cur.trim()); };
  for (const p of paras) {
    if (cur && (cur.length + p.length + 2) > SIZE) {
      push();
      cur = cur.slice(-OVERLAP) + '\n\n';
    }
    if (p.length > SIZE) {
      for (let i = 0; i < p.length; i += SIZE - OVERLAP) {
        cur += p.slice(i, i + SIZE);
        push();
        cur = '';
      }
      continue;
    }
    cur += (cur.endsWith('\n\n') || !cur ? '' : '\n\n') + p;
  }
  push();
  return chunks;
}

export function titleFrom(text, filename) {
  const h = text.match(/^#\s+(.+)$/m);
  return (h ? h[1] : filename.replace(/\.[^.]+$/, '')).trim();
}

export async function listDocuments() {
  return check(await db().from('kb_documents')
    .select('id, title, source, status, chunk_count, updated_at').order('updated_at', { ascending: false }));
}

// Ingesta completa dentro de la misma petición (simple; cabe en el maxDuration de 300 s de Vercel).
export async function ingest({ text, filename, source, uploadedBy = null, replaceSameTitle = false }) {
  const content = String(text || '').trim();
  if (!content) throw new HttpError(400, 'El archivo está vacío.');
  const title = titleFrom(content, filename);
  if (replaceSameTitle) check(await db().from('kb_documents').delete().eq('title', title));

  const doc = check(await db().from('kb_documents')
    .insert({ title, source, status: 'procesando', uploaded_by: uploadedBy }).select('id').single());
  try {
    const chunks = chunkText(content);
    const vectors = await embed(chunks, 'RETRIEVAL_DOCUMENT');
    const rows = chunks.map((c, i) => ({ document_id: doc.id, content: c, embedding: vectors[i] }));
    for (let i = 0; i < rows.length; i += 200) check(await db().from('kb_chunks').insert(rows.slice(i, i + 200)));
    check(await db().from('kb_documents')
      .update({ status: 'procesado', chunk_count: chunks.length, updated_at: new Date().toISOString() }).eq('id', doc.id));
    return { id: doc.id, title, chunks: chunks.length, status: 'procesado' };
  } catch (err) {
    await db().from('kb_documents').update({ status: 'error', updated_at: new Date().toISOString() }).eq('id', doc.id);
    throw err;
  }
}

export async function search(query) {
  const q = typeof query === 'string' ? query.trim().slice(0, 1000) : '';
  if (!q) throw new HttpError(400, 'Escribe una pregunta para probar.');
  const [vector] = await embed([q], 'RETRIEVAL_QUERY');
  return check(await db().rpc('match_chunks', { query_embedding: vector, match_count: 3, min_similarity: 0 })) || [];
}
