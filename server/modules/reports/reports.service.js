import { db, check } from '../../common/supabase.js';

const pick = (v, allowed) => (allowed.includes(v) ? v : null);
const pickMany = (arr, allowed) => (Array.isArray(arr) ? [...new Set(arr.filter((v) => allowed.includes(v)))] : []);
const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

async function newCode() {
  for (let i = 0; i < 5; i++) {
    const code = 'RI-' + Math.floor(100000 + Math.random() * 900000);
    const { data } = await db().from('reports').select('id').eq('code', code).maybeSingle();
    if (!data) return code;
  }
  return 'RI-' + Date.now().toString().slice(-6);
}

export async function createReport(body = {}) {
  const isAnonymous = body.isAnonymous !== false;
  const danger = pick(body.danger, ['si', 'no', 'no_se']);
  const code = await newCode();

  const report = check(await db().from('reports').insert({
    code,
    is_anonymous: isAnonymous,
    device_safe: pick(body.deviceSafe, ['si', 'no', 'no_seguro']),
    danger,
    has_risk: danger === 'si',
    violence_types: pickMany(body.violenceTypes, ['fisica', 'psicologica', 'sexual', 'economica', 'no_se']),
    place: text(body.place, 120),
    description: text(body.description, 5000),
    support_types: pickMany(body.supportTypes, ['psico', 'legal', 'medico', 'info']),
  }).select('id').single());

  const c = body.contact || {};
  if (!isAnonymous) {
    check(await db().from('persons').insert({
      report_id: report.id,
      alias: text(c.alias, 80),
      contact_method: pick(c.method, ['sms', 'whatsapp', 'llamada']),
      contact_value: text(c.value, 40),
      safe_schedule: text(c.safeSchedule, 200),
      address: text(c.address, 200), // opcional
    }));
  }
  check(await db().from('case_events').insert({
    report_id: report.id,
    event_type: 'creado',
    detail: danger === 'si' ? 'Reporte recibido. Marcó peligro inmediato.' : 'Reporte recibido.',
  }));
  const consents = [{ report_id: report.id, purpose: 'registro_reporte', granted: true }];
  if (!isAnonymous) consents.push({ report_id: report.id, purpose: 'contacto', granted: true });
  check(await db().from('consents').insert(consents));

  return { code, isAnonymous };
}
