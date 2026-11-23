// Prueba de humo del flujo feliz con peticiones HTTP reales.
// Uso: npm run smoke                      (local, http://localhost:5173 con el proxy de Vite)
//      npm run smoke -- https://<app>.vercel.app
// Al final borra lo que creó (reporte y documento) con la service key del .env.
import { db } from '../server/common/supabase.js';

const BASE = (process.argv[2] || process.env.SMOKE_URL || 'http://localhost:5173').replace(/\/$/, '');
const STAMP = Date.now().toString(36);
const DOC_TITLE = `Prueba de humo ${STAMP}`;
const SECRET_WORD = `Quillapampa-${STAMP}`;
let token = null;
let reportCode = null;
const results = [];

async function api(method, path, body, { form } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body && !form) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + '/api' + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${json.message || ''}`);
  return json;
}

async function step(name, fn) {
  const t0 = performance.now();
  try {
    const d = await fn();
    const ms = Math.round(performance.now() - t0);
    results.push(true);
    console.log(`✓ ${name} (${ms} ms)${d ? '\n    ' + d : ''}`);
  } catch (e) {
    results.push(false);
    console.log(`✗ ${name} — ${e.message}`);
  }
}

const assert = (c, m) => { if (!c) throw new Error(m); };

console.log(`Prueba de humo contra ${BASE}\n`);

await step('GET /api/health', async () => {
  const r = await api('GET', '/health');
  assert(r.status === 'ok', 'health no responde ok');
});

await step('Reporte con contacto y peligro inmediato', async () => {
  const r = await api('POST', '/reports', {
    isAnonymous: false, deviceSafe: 'si', danger: 'si', violenceTypes: ['fisica', 'psicologica'], place: 'Vivienda',
    supportTypes: ['legal', 'psico'],
    contact: { alias: 'María (prueba)', method: 'sms', value: '987654321', safeSchedule: 'Lunes a viernes, 9 a 11 a. m.' },
  });
  assert(/^RI-\d{6}$/.test(r.code), 'código inválido');
  reportCode = r.code;
  return `código ${r.code}`;
});

await step('Asistente: «¿Necesito un abogado para denunciar?»', async () => {
  const r = await api('POST', '/rag/chat', { message: '¿Necesito un abogado para denunciar?' });
  assert(r.answer && r.sources?.length && r.risk === false, 'sin respuesta o sin fuentes');
  return `fuentes: ${r.sources.map((s) => s.title).join(', ')}`;
});

await step('Asistente detecta riesgo sin modelo', async () => {
  const r = await api('POST', '/rag/chat', { message: 'tengo miedo, me va a golpear' });
  assert(r.risk === true, 'no marcó riesgo');
});

await step('Login como admin', async () => {
  const r = await api('POST', '/auth/login', { email: 'admin@rimay.pe', password: 'rimay2026' });
  token = r.token;
  return `${r.user.fullName} (${r.user.role})`;
});

let caseId;
let before;
await step('El reporte aparece primero en /api/cases con riesgo', async () => {
  before = await api('GET', '/stats/dashboard');
  const { cases } = await api('GET', '/cases?filter=all');
  assert(cases[0].code === reportCode, `el primero es ${cases[0].code}, no ${reportCode}`);
  assert(cases[0].hasRisk, 'no está marcado con riesgo');
  assert(cases[0].contact.masked === '••• ••• 321', 'contacto no enmascarado');
  caseId = cases[0].id;
  return `${cases[0].code} · ${cases[0].alias} · ${cases[0].contact.masked}`;
});

await step('Mostrar contacto, asignar, «contactado» y nota → historial', async () => {
  const c = await api('POST', `/cases/${caseId}/contact-access`);
  assert(c.value === '987654321', 'contacto incorrecto');
  const me = (await api('GET', '/auth/me')).user;
  await api('PATCH', `/cases/${caseId}/assign`, { staffId: me.id });
  await api('PATCH', `/cases/${caseId}/status`, { status: 'contactado' });
  const d = await api('POST', `/cases/${caseId}/notes`, { text: 'Primer contacto por SMS en horario seguro.' });
  const types = d.events.map((e) => e.type);
  for (const t of ['creado', 'acceso_contacto', 'asignado', 'estado', 'nota']) assert(types.includes(t), `falta el evento ${t}`);
  assert(d.status === 'contactado' && d.assignedTo?.id === me.id, 'estado o asignación sin cambiar');
  return `historial: ${types.join(' → ')}`;
});

await step('El dashboard cambia', async () => {
  const after = await api('GET', '/stats/dashboard');
  assert(after.byStatus.contactado === before.byStatus.contactado + 1, 'contactado no subió');
  assert(after.byStatus.pendiente === before.byStatus.pendiente - 1, 'pendiente no bajó');
  return `pendiente ${before.byStatus.pendiente}→${after.byStatus.pendiente} · contactado ${before.byStatus.contactado}→${after.byStatus.contactado} · horas a primer contacto ${before.avgHoursToFirstContact}→${after.avgHoursToFirstContact}`;
});

await step('Subir un .md a la base de conocimiento → procesado', async () => {
  const md = `# ${DOC_TITLE}\n\nFuente: Prueba automática\n\nEl punto de encuentro comunitario ${SECRET_WORD} abre los sábados y ofrece talleres de autocuidado para mujeres del barrio.\n`;
  const form = new FormData();
  form.append('file', new Blob([md], { type: 'text/markdown' }), 'prueba-humo.md');
  const r = await api('POST', '/kb/documents', null, { form });
  assert(r.status === 'procesado', 'no quedó procesado');
  const docs = await api('GET', '/kb/documents');
  assert(docs.some((d) => d.title === DOC_TITLE && d.status === 'procesado'), 'no aparece en la lista');
  return `${r.title}: ${r.chunks} fragmento(s)`;
});

await step('Una pregunta sobre su contenido lo recupera', async () => {
  const hits = await api('POST', '/kb/search', { query: `¿Qué ofrece el punto de encuentro ${SECRET_WORD} los sábados?` });
  assert(hits[0]?.document_title === DOC_TITLE, `primer resultado: ${hits[0]?.document_title}`);
  return `[${hits[0].similarity.toFixed(3)}] ${hits[0].document_title}`;
});

// Limpieza
await step('Limpieza de datos de la prueba', async () => {
  if (reportCode) await db().from('reports').delete().eq('code', reportCode);
  await db().from('kb_documents').delete().eq('title', DOC_TITLE);
});

const failed = results.filter((r) => !r).length;
console.log(failed ? `\n✗ ${failed} paso(s) fallido(s).` : '\n✓ Flujo feliz completo.');
process.exit(failed ? 1 : 0);
