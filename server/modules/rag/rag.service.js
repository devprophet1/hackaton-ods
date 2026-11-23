import { db, check } from '../../common/supabase.js';
import { embed, generate } from '../../common/gemini.js';

const RISK_TERMS = ['matar', 'me mata', 'me va a', 'miedo', 'peligro', 'golpea', 'golpe', 'arma', 'cuchillo', 'ahora mismo', 'amenaz'];
const RISK_ANSWER = 'Lo que cuentas es serio y tu seguridad es lo primero. Si estás en peligro ahora, llama al 105 o a la Línea 100.';
const NO_CONTEXT = 'No tengo información suficiente para responder eso. Te recomiendo llamar a la Línea 100 (gratuita, confidencial y las 24 horas, en español, quechua y aimara) o escribir al Chat 100: https://chat100.warminan.gob.pe';

export const SYSTEM_PROMPT = [
  'Eres el asistente de orientación de Rimay, una plataforma de apoyo frente a la violencia en Villa El Salvador, Lima, Perú.',
  '',
  'Reglas:',
  '1. Responde solo con base en el CONTEXTO. Si no hay información suficiente, dilo y recomienda la Línea 100.',
  '2. Usa los tipos de violencia de la Ley N.º 30364 (física, psicológica, sexual, económica o patrimonial) solo para explicar; nunca diagnostiques ni califiques el riesgo.',
  '3. Apoyo psicológico de primera respuesta: escucha sin juzgar, valida lo que siente la persona, pregunta qué necesita, ayúdala a pensar en su seguridad y facilita el contacto con apoyo humano. Nunca ofrezcas terapia ni evaluación clínica.',
  '4. Deriva siempre a canales oficiales:',
  '   - Línea 100 (MIMP): gratuita, confidencial, 24 horas, en español, quechua y aimara.',
  '   - Chat 100: https://chat100.warminan.gob.pe',
  '   - Centro de Emergencia Mujer más cercano.',
  '   - Comisaría o Central Única de Denuncias para denunciar.',
  '   - 105 (Policía) si hay riesgo inmediato; 106 (SAMU) para emergencias médicas.',
  '5. Nunca pidas datos personales ni que la persona repita su relato.',
  '6. Responde en español, con frases cortas, tono cálido y claro. Máximo 120 palabras.',
].join('\n');

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function hasRisk(message) {
  const m = normalize(message);
  return RISK_TERMS.some((t) => m.includes(t));
}

export async function chat(message) {
  const q = typeof message === 'string' ? message.trim().slice(0, 1000) : '';
  if (!q) return { answer: 'Escribe tu pregunta y te oriento.', sources: [], risk: false };

  // 1. Riesgo: respuesta fija, sin llamar al modelo.
  if (hasRisk(q)) return { answer: RISK_ANSWER, sources: [], risk: true };

  // 2-3. Recuperación.
  const [vector] = await embed([q], 'RETRIEVAL_QUERY');
  const chunks = check(await db().rpc('match_chunks', { query_embedding: vector, match_count: 5, min_similarity: 0.5 })) || [];

  // 4. Sin contexto: sin modelo.
  if (!chunks.length) return { answer: NO_CONTEXT, sources: [], risk: false };

  // 5. Modelo.
  const context = chunks.map((c, i) => `[${i + 1}] ${c.document_title}\n${c.content}`).join('\n\n');
  const answer = await generate(SYSTEM_PROMPT, `CONTEXTO:\n${context}\n\nPREGUNTA:\n${q}`);

  // 6. Fuentes únicas.
  const seen = new Set();
  const sources = [];
  for (const c of chunks) {
    if (seen.has(c.document_title)) continue;
    seen.add(c.document_title);
    sources.push({ title: c.document_title, source: c.source });
  }
  return { answer: answer || NO_CONTEXT, sources, risk: false };
}
