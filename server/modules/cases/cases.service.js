import { db, check } from '../../common/supabase.js';
import { HttpError } from '../../common/errors.js';

const STATUS_ORDER = ['pendiente', 'contactado', 'derivado_cem', 'derivado_comisaria', 'cerrado'];
export const STATUS_LABEL = {
  pendiente: 'Pendiente',
  contactado: 'Contactado',
  derivado_cem: 'Derivado al CEM',
  derivado_comisaria: 'Derivado a comisaría',
  cerrado: 'Cerrado',
};
const HOUR = 3600 * 1000;

const SELECT = 'id, code, has_risk, status, violence_types, place, support_types, assigned_to, first_contact_at, created_at, ' +
  'persons(alias, contact_method, contact_value, safe_schedule), staff(id, full_name)';

const one = (v) => (Array.isArray(v) ? v[0] : v) || null;
const isOpen = (r) => r.status !== 'cerrado';
const riskActive = (r) => r.has_risk && isOpen(r);

export function mask(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? '••• ••• ' + digits.slice(-3) : 'No indicado';
}

function toCase(r) {
  const p = one(r.persons) || {};
  const s = one(r.staff);
  return {
    id: r.id,
    code: r.code,
    alias: p.alias || 'Sin nombre',
    hasRisk: r.has_risk,
    status: r.status,
    violenceTypes: r.violence_types || [],
    place: r.place,
    supportTypes: r.support_types || [],
    contact: { method: p.contact_method, masked: mask(p.contact_value), safeSchedule: p.safe_schedule || 'No indicado' },
    assignedTo: s ? { id: s.id, fullName: s.full_name } : null,
    firstContactAt: r.first_contact_at,
    createdAt: r.created_at,
  };
}

const FILTERS = {
  all: (r) => isOpen(r),
  risk: (r) => riskActive(r),
  pending: (r) => r.status === 'pendiente',
  mine: (r, me) => r.assigned_to === me && isOpen(r),
  unassigned: (r) => !r.assigned_to && isOpen(r),
  closed: (r) => r.status === 'cerrado',
};

export async function listCases(filter, staffId) {
  const rows = check(await db().from('reports').select(SELECT).eq('is_anonymous', false));
  const fn = FILTERS[filter] || FILTERS.all;
  const list = rows.filter((r) => fn(r, staffId)).sort((a, b) =>
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
  const row = check(await db().from('reports').select(SELECT).eq('id', id).eq('is_anonymous', false).maybeSingle());
  if (!row) throw new HttpError(404, 'Caso no encontrado.');
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
  return { value: one(row.persons)?.contact_value || 'No indicado' };
}

export async function assign(id, staffId, staff) {
  await getRow(id);
  let detail = 'Caso sin asignar.';
  if (staffId) {
    const target = check(await db().from('staff').select('id, full_name').eq('id', staffId).maybeSingle());
    if (!target) throw new HttpError(400, 'La persona elegida no existe.');
    detail = `Asignado a ${target.full_name}.`;
  }
  check(await db().from('reports').update({ assigned_to: staffId || null }).eq('id', id));
  await addEvent(id, staff.id, 'asignado', detail);
  return getCase(id);
}

export async function setStatus(id, status, staff) {
  if (!STATUS_ORDER.includes(status)) throw new HttpError(400, 'Estado no válido.');
  const row = await getRow(id);
  const patch = { status };
  if (status !== 'pendiente' && !row.first_contact_at) patch.first_contact_at = new Date().toISOString();
  if (status === 'derivado_cem') patch.derived_to = 'cem';
  if (status === 'derivado_comisaria') patch.derived_to = 'comisaria';
  check(await db().from('reports').update(patch).eq('id', id));
  await addEvent(id, staff.id, 'estado', `Estado: ${STATUS_LABEL[status]} (${staff.full_name}).`);
  return getCase(id);
}

export async function addNote(id, text, staff) {
  const t = typeof text === 'string' ? text.trim().slice(0, 2000) : '';
  if (!t) throw new HttpError(400, 'Escribe una nota.');
  await getRow(id);
  await addEvent(id, staff.id, 'nota', `Nota de ${staff.full_name}: ${t}`);
  return getCase(id);
}
