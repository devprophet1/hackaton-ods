import { db, check } from '../../common/supabase.js';

const HOUR = 3600 * 1000;
const LIMA_OFFSET = -5 * HOUR; // Perú no usa horario de verano
const limaDay = (t) => new Date(new Date(t).getTime() + LIMA_OFFSET).toISOString().slice(0, 10);

export async function dashboard() {
  const rows = check(await db().from('reports')
    .select('is_anonymous, has_risk, status, violence_types, derived_to, first_contact_at, created_at'));
  const cases = rows.filter((r) => !r.is_anonymous);
  const active = cases.filter((r) => r.status !== 'cerrado');
  const contacted = cases.filter((r) => r.first_contact_at);
  const avg = contacted.length
    ? contacted.reduce((s, r) => s + (new Date(r.first_contact_at) - new Date(r.created_at)), 0) / contacted.length / HOUR
    : 0;

  const byStatus = { pendiente: 0, contactado: 0, derivado_cem: 0, derivado_comisaria: 0, cerrado: 0 };
  cases.forEach((r) => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });

  const byViolenceType = { fisica: 0, psicologica: 0, sexual: 0, economica: 0, no_se: 0 };
  rows.forEach((r) => (r.violence_types || []).forEach((t) => { byViolenceType[t] = (byViolenceType[t] || 0) + 1; }));

  const days = [];
  for (let i = 6; i >= 0; i--) days.push(limaDay(Date.now() - i * 24 * HOUR));
  const perDay = Object.fromEntries(days.map((d) => [d, 0]));
  rows.forEach((r) => { const d = limaDay(r.created_at); if (d in perDay) perDay[d]++; });

  return {
    activeCases: active.length,
    activeRisk: active.filter((r) => r.has_risk).length,
    avgHoursToFirstContact: Math.round(avg * 10) / 10,
    derived: cases.filter((r) => r.derived_to).length,
    byStatus,
    byViolenceType,
    last7Days: days.map((date) => ({ date, total: perDay[date] })),
    derivations: {
      cem: cases.filter((r) => r.derived_to === 'cem').length,
      comisaria: cases.filter((r) => r.derived_to === 'comisaria').length,
    },
    overdueRisk: cases.filter((r) => r.has_risk && r.status === 'pendiente' && Date.now() - new Date(r.created_at) > HOUR).length,
  };
}
