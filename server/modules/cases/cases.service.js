import { db, check } from '../../common/supabase.js';
import { HttpError } from '../../common/errors.js';
import { embed, chat as aiChat, minSimilarity } from '../../common/ai.js';

// Seguimiento sin asignación a personal: 4 estados, persona de contacto y entidad de derivación.
const STATUS_ORDER = ['pendiente', 'contactado', 'derivado', 'cerrado'];
export const STATUS_LABEL = { pendiente: 'Pendiente', contactado: 'Contactado', derivado: 'Derivado', cerrado: 'Cerrado' };
const DERIVED_LABEL = { cem: 'CEM', policia: 'Policía', otra: 'Otra entidad' };
const HOUR = 3600 * 1000;

const SELECT = 'id, code, has_risk, status, violence_types, place, support_types, description, contact_person, derived_to, derived_entity, first_contact_at, created_at, ' +
  'persons(alias, contact_method, contact_value, safe_schedule, address)';

const one = (v) => (Array.isArray(v) ? v[0] : v) || null;
const isOpen = (r) => r.status !== 'cerrado';
const riskActive = (r) => r.has_risk && isOpen(r);
const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export function mask(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? '••• ••• ' + digits.slice(-3) : 'No indicado';
}

// Nombre visible de la derivación: «CEM», «Policía» o el nombre de la otra entidad.
export const derivedName = (to, entity) => (to === 'otra' ? (entity || 'Otra entidad') : DERIVED_LABEL[to] || null);

function toCase(r) {
  const p = one(r.persons) || {};
  return {
    id: r.id,
    code: r.code,
    alias: p.alias || 'Sin nombre',
    hasRisk: r.has_risk,
    status: r.status,
    violenceTypes: r.violence_types || [],
    place: r.place,
    supportTypes: r.support_types || [],
    contact: { method: p.contact_method, masked: mask(p.contact_value), safeSchedule: p.safe_schedule || 'No indicado', hasAddress: !!p.address },
    contactPerson: r.contact_person,
    derivedTo: r.derived_to,
    derivedEntity: r.derived_entity,
    derivedName: derivedName(r.derived_to, r.derived_entity),
    firstContactAt: r.first_contact_at,
    createdAt: r.created_at,
  };
}

const FILTERS = {
  all: (r) => isOpen(r),
  risk: (r) => riskActive(r),
  pending: (r) => r.status === 'pendiente',
  contacted: (r) => r.status === 'contactado',
  derived: (r) => r.status === 'derivado',
  closed: (r) => r.status === 'cerrado',
};

export async function listCases(filter) {
  const rows = check(await db().from('reports').select(SELECT));
  const fn = FILTERS[filter] || FILTERS.all;
  // Riesgo pendiente primero; luego por estado y más reciente.
  const riskPendingFirst = (r) => (r.has_risk && r.status === 'pendiente' ? 1 : 0);
  const list = rows.filter(fn).sort((a, b) =>
    riskPendingFirst(b) - riskPendingFirst(a) ||
    riskActive(b) - riskActive(a) ||
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
    new Date(b.created_at) - new Date(a.created_at));
  const overdue = rows.filter((r) => r.has_risk && r.status === 'pendiente' && Date.now() - new Date(r.created_at) > HOUR);
  return {
    cases: list.map(toCase),
    summary: {
      overdueRisk: overdue.map((r) => r.id),
      riskPending: rows.filter((r) => r.has_risk && r.status === 'pendiente').length,
    },
  };
}


async function getRow(id) {
  const row = check(
    await db()
      .from('reports')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle()
  );

  if (!row) {
    throw new HttpError(404, 'Caso no encontrado.');
  }

  return row;
}


async function addEvent(reportId, actorId, type, detail) {
  check(await db().from('case_events').insert({ report_id: reportId, actor_id: actorId, event_type: type, detail }));
}

export async function getCase(id) {
  const row = await getRow(id);
  const events = check(await db().from('case_events').select('id, event_type, detail, created_at, staff(full_name)')
    .eq('report_id', id).order('created_at', { ascending: false }));
  return {
    ...toCase(row),
    events: events.map((e) => ({ id: e.id, type: e.event_type, detail: e.detail, actor: one(e.staff)?.full_name || null, createdAt: e.created_at })),
  };
}

export async function contactAccess(id, staff) {
  const row = await getRow(id);
  await addEvent(id, staff.id, 'acceso_contacto', `Datos de contacto vistos por ${staff.full_name}.`);
  const p = one(row.persons) || {};
  // La dirección (opcional) se entrega junto con el contacto: mismo acceso registrado.
  return { value: p.contact_value || 'No indicado', address: p.address || null };
}

// Guarda estado, persona de contacto y derivación en un solo evento del historial.
// Ej.: «Derivado a CEM. Contacto: Lic. Ana Torres (Administradora Rimay)».
export async function updateFollowUp(id, body = {}, staff) {
  const status = body.status;
  if (!STATUS_ORDER.includes(status)) throw new HttpError(400, 'Estado no válido.');
  const row = await getRow(id);

  const patch = { status };
  if (status !== 'pendiente' && !row.first_contact_at) patch.first_contact_at = new Date().toISOString();
  if (status !== 'pendiente') patch.contact_person = text(body.contactPerson, 160) ?? row.contact_person;
  if (status === 'derivado') {
    patch.derived_to = ['cem', 'policia', 'otra'].includes(body.derivedTo) ? body.derivedTo : 'cem';
    patch.derived_entity = patch.derived_to === 'otra' ? text(body.derivedEntity, 160) : null;
  }
  check(await db().from('reports').update(patch).eq('id', id));

  const parts = [status === 'derivado' ? `Derivado a ${derivedName(patch.derived_to, patch.derived_entity)}.` : `${STATUS_LABEL[status]}.`];
  if (status !== 'pendiente' && patch.contact_person) parts.push(`Contacto: ${patch.contact_person}`);
  await addEvent(id, staff.id, 'estado', `${parts.join(' ')} (${staff.full_name})`);
  return getCase(id);
}

export async function addNote(id, note, staff) {
  const t = typeof note === 'string' ? note.trim().slice(0, 2000) : '';
  if (!t) throw new HttpError(400, 'Escribe una nota.');
  await getRow(id);
  await addEvent(id, staff.id, 'nota', `Nota de ${staff.full_name}: ${t}`);
  return getCase(id);
}

// ── Análisis de apoyo (IA) para quien administra el caso ───────────────────────────────────────
// Se genera bajo demanda y no se guarda. No se envían al modelo el alias ni el número de contacto.
const TYPE = { fisica: 'física', psicologica: 'psicológica', sexual: 'sexual', economica: 'económica o patrimonial', no_se: 'no identificada' };
const SUPPORT = { psico: 'psicológico', legal: 'legal', medico: 'médico', info: 'información general' };

const ANALYSIS_PROMPT = [
  'Eres un asistente de apoyo para el equipo que da seguimiento a reportes de violencia en Rimay (Villa El Salvador, Lima, Perú).',
  'Recibes los datos de un caso y fragmentos de la guía de Rimay (CONTEXTO). Ayudas a la persona administradora a decidir el siguiente paso; la decisión siempre es humana.',
  '',
  'Reglas:',
  '1. Usa solo los DATOS DEL CASO y el CONTEXTO. No inventes hechos, nombres, teléfonos ni direcciones.',
  '2. No hagas diagnóstico clínico ni psicológico, ni califiques el riesgo con puntajes. Puedes señalar lo que la persona reportó (por ejemplo, «marcó peligro inmediato») y los tipos de violencia de la Ley N.º 30364 que podrían corresponder, con cuidado («podría corresponder a…»).',
  '3. Las opciones deben ser concretas y realistas con los canales de Rimay: contactar por el medio y horario seguros, derivar al CEM (orientación legal, psicológica y social), a la Policía (105 o comisaría) si hay riesgo inmediato, u otra entidad. Si marcó peligro inmediato y sigue pendiente, la primera opción es contactar cuanto antes.',
  '4. Texto plano en español, sin Markdown (sin asteriscos ni almohadillas). Usa exactamente estas secciones, cada título en su propia línea:',
  'Resumen:',
  '(2 frases)',
  'Señales de atención:',
  '- (2 a 4 puntos)',
  'Opciones sugeridas:',
  '- (2 o 3 opciones, la más urgente primero)',
  'A tener en cuenta:',
  '(1 frase: que es un apoyo orientativo y la decisión corresponde al equipo)',
].join('\n');

export async function analyze(id) {
  const c = await getCase(id);
  const row = await getRow(id);
  const hours = Math.round((Date.now() - new Date(c.createdAt)) / HOUR);
  const data = [
    `Código: ${c.code}`,
    `Marcó peligro inmediato: ${c.hasRisk ? 'sí' : 'no'}`,
    `Estado actual: ${STATUS_LABEL[c.status]}${c.status === 'derivado' ? ` (a ${c.derivedName})` : ''}`,
    `Horas desde el reporte: ${hours}`,
    `Primer contacto: ${c.firstContactAt ? 'sí' : 'todavía no'}`,
    `Tipos de violencia marcados: ${c.violenceTypes.map((t) => TYPE[t] || t).join(', ') || 'no indicado'}`,
    `Lugar: ${c.place || 'no indicado'}`,
    `Apoyo pedido: ${c.supportTypes.map((t) => SUPPORT[t] || t).join(', ') || 'no indicado'}`,
    `Medio de contacto seguro: ${c.contact.method || 'no indicado'}; horario seguro: ${c.contact.safeSchedule}`,
    `Relato de la persona: ${row.description ? row.description.slice(0, 1500) : 'no escribió relato'}`,
    `Historial (más reciente primero): ${c.events.slice(0, 8).map((e) => e.detail).join(' | ')}`,
  ].join('\n');

  // Contexto de la guía: denuncia, CEM, plan de seguridad, tipos de violencia…
  const query = `${data}\n¿Qué opciones de apoyo y derivación hay para este caso?`;
  const [vector] = await embed([query], 'query');
  const chunks = check(await db().rpc('match_chunks', { query_embedding: vector, match_count: 4, min_similarity: minSimilarity() })) || [];
  const context = chunks.map((ch, i) => `[${i + 1}] ${ch.document_title}\n${ch.content}`).join('\n\n') || '(sin fragmentos)';

  const raw = await aiChat(ANALYSIS_PROMPT, `DATOS DEL CASO:\n${data}\n\nCONTEXTO:\n${context}`);
  const analysis = (raw || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,6}\s+/gm, '').trim();
  const sources = [...new Set(chunks.map((ch) => ch.document_title))];
  return { analysis, sources, generatedAt: new Date().toISOString() };
}
