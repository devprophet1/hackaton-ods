// Valida el entorno: variables, proveedor de IA activo y Supabase. Nunca muestra valores ni claves.
// Uso: npm run check
import { createClient } from '@supabase/supabase-js';
import { config } from '../server/common/config.js';
import { embed, chat, provider, models, redact, requiredEnv, PROVIDERS, EMBEDDING_DIM } from '../server/common/ai.js';

const results = [];

async function step(name, fn) {
  const t0 = performance.now();
  try {
    const detail = await fn();
    const ms = Math.round(performance.now() - t0);
    results.push({ ok: true, name, detail, ms });
    console.log(`✓ ${name} (${ms} ms)${detail ? ' — ' + detail : ''}`);
    return true;
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    const detail = redact(err?.message || err);
    results.push({ ok: false, name, detail, ms });
    console.log(`✗ ${name} (${ms} ms) — ${detail}`);
    return false;
  }
}

const isVector = (v) => Array.isArray(v) && v.length === EMBEDDING_DIM && v.every((x) => typeof x === 'number' && Number.isFinite(x));

const p = provider();
const m = models();
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', ...requiredEnv()];
const prefix = p.toUpperCase();
const optional = [`${prefix}_EMBEDDING_MODEL`, `${prefix}_CHAT_MODEL`, ...(p === 'openrouter' ? ['OPENROUTER_BASE_URL'] : [])];

console.log(`Proveedor de IA: ${p} · embeddings: ${m.embedding} · chat: ${m.chat}\n`);

// a. Variables
const varsOk = await step('Variables de entorno', () => {
  if (!PROVIDERS.includes(p)) throw new Error(`AI_PROVIDER debe ser uno de: ${PROVIDERS.join(', ')}.`);
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length) throw new Error('faltan: ' + missing.join(', '));
  const defaults = optional.filter((k) => !process.env[k]?.trim());
  return `presentes: ${required.join(', ')}` + (defaults.length ? ` · con valor por defecto: ${defaults.join(', ')}` : '');
});

if (varsOk) {
  // b. Embedding de un texto
  await step(`Embedding de un texto (${m.embedding})`, async () => {
    const [v] = await embed(['La Línea 100 atiende las 24 horas'], 'query');
    if (!isVector(v)) throw new Error(`se esperaban ${EMBEDDING_DIM} números`);
    return `${v.length} dimensiones`;
  });

  // c. Embedding en lote
  await step('Embedding en lote de dos textos', async () => {
    const vs = await embed(['La Línea 100 es gratuita.', 'El Centro de Emergencia Mujer brinda atención.'], 'document');
    if (vs.length !== 2 || !vs.every(isVector)) throw new Error(`se esperaban 2 vectores de ${EMBEDDING_DIM}`);
    return `2 vectores de ${EMBEDDING_DIM} dimensiones`;
  });

  // d. Chat
  await step(`Chat (${m.chat})`, async () => {
    const text = await chat('Responde en español en una sola frase', '¿Qué es la Línea 100 en Perú?');
    if (!text?.trim()) throw new Error('respuesta vacía');
    return `«${text.trim()}»`;
  });

  // e. Supabase
  await step('Supabase (Auth admin, listUsers perPage 1)', async () => {
    const sb = createClient(config.supabaseUrl, config.supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw new Error(error.message);
    return `respuesta correcta (${data.users.length} usuario en la página)`;
  });
}

// f. Resumen
console.log('\nResumen');
for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.name} — ${r.ms} ms`);
console.log(`  Proveedor: ${p} · embeddings: ${m.embedding} (${EMBEDDING_DIM} dim) · chat: ${m.chat}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n✗ ${failed} comprobación(es) fallida(s).` : '\n✓ Todo correcto.');
process.exit(failed ? 1 : 0);
