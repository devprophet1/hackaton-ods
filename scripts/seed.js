// Seed de demostración (idempotente): usuarios de Auth, staff, 5 casos con contacto y 20 reportes anónimos.
// Todos los datos son ficticios. Uso: npm run seed
import { randomUUID } from 'node:crypto';
import { db } from '../server/common/supabase.js';

const H = 3600 * 1000;
const now = Date.now();
const ago = (h) => new Date(now - h * H).toISOString();

// Un solo rol («admin») y una sola cuenta con acceso al panel: admin@rimay.pe.
// previousEmails: si existe la cuenta antigua, se le cambia el correo (conserva su id y sus casos asignados).
// Lucía y Sofía siguen en staff para poder asignarles casos, pero sus cuentas están bloqueadas (sin login).
const USERS = [
  { email: 'admin@rimay.pe', previousEmails: ['coordinadora@rimay.pe'], password: 'rimay2026', full_name: 'Administradora Rimay' },
  { email: 'gestora@rimay.pe', password: randomUUID(), full_name: 'Lucía Ramos', banned: true },
  { email: 'sofia.huaman@rimay.pe', password: randomUUID(), full_name: 'Sofía Huamán', banned: true },
];

function ok({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function findUser(email) {
  for (let page = 1; page < 20; page++) {
    const { users } = ok(await db().auth.admin.listUsers({ page, perPage: 200 }), 'listUsers');
    const u = users.find((x) => x.email === email);
    if (u || users.length < 200) return u;
  }
}

async function ensureUser(u) {
  let user = await findUser(u.email);
  for (const old of u.previousEmails || []) {
    if (user) break;
    user = await findUser(old);
    if (user) console.log(`  ${old} → ${u.email} (mismo usuario)`);
  }
  const attrs = { email: u.email, password: u.password, email_confirm: true, ban_duration: u.banned ? '876000h' : 'none' };
  if (user) ok(await db().auth.admin.updateUserById(user.id, attrs), 'updateUser ' + u.email);
  else user = ok(await db().auth.admin.createUser({ email: u.email, ...attrs }), 'createUser ' + u.email).user;
  ok(await db().from('staff').upsert({ id: user.id, full_name: u.full_name, role: 'admin' }), 'staff ' + u.email);
  console.log(`✓ ${u.full_name} <${u.email}>${u.banned ? ' (bloqueada, sin acceso al panel)' : ''}`);
  return user.id;
}

async function main() {
  const ids = [];
  for (const u of USERS) ids.push(await ensureUser(u));
  const staff = { admin: ids[0], lucia: ids[1], sofia: ids[2] };

  // Seguimiento sin asignación: estado, quién contacta (contact) y derivación (derived/entity). Nombres ficticios.
  const CASES = [
    { code: 'RI-482193', alias: 'Rosa', risk: true, types: ['psicologica', 'fisica'], place: 'Vivienda', support: ['legal', 'psico'],
      method: 'sms', value: '987654821', schedule: 'Lunes a viernes, 9 a 11 a. m.', status: 'pendiente', created: 2,
      description: 'Mi pareja me grita, me revisa el celular y ayer me empujó. Tengo miedo de que vuelva a pasar.',
      events: [[2, null, 'creado', 'Reporte recibido. Marcó peligro inmediato.']] },
    { code: 'RI-590012', alias: 'Ana', risk: false, types: ['economica'], place: 'Vivienda', support: ['legal'],
      method: 'llamada', value: '912334106', schedule: 'Tardes, de 3 a 5 p. m.', status: 'pendiente', created: 5,
      events: [[5, null, 'creado', 'Reporte recibido.']] },
    { code: 'RI-305774', alias: 'Flor', risk: false, types: ['psicologica'], place: 'Espacio público', support: ['psico'],
      method: 'whatsapp', value: '955210377', schedule: 'Noches, de 8 a 9 p. m.', status: 'contactado', created: 30, firstContact: 27,
      contact: 'Lic. Ana Torres, psicóloga del CEM',
      events: [[30, null, 'creado', 'Reporte recibido.'], [27, staff.admin, 'estado', 'Contactado. Contacto: Lic. Ana Torres, psicóloga del CEM (Administradora Rimay)']] },
    { code: 'RI-118450', alias: 'M.', risk: true, types: ['fisica', 'psicologica'], place: 'Vivienda', support: ['legal'],
      method: 'sms', value: '944501238', schedule: 'Mañanas, de 8 a 10 a. m.', status: 'derivado', derived: 'policia', created: 50, firstContact: 49,
      contact: 'Lic. Jorge Quispe, trabajador social',
      events: [[50, null, 'creado', 'Reporte recibido. Marcó peligro inmediato.'], [49, staff.admin, 'estado', 'Contactado. Contacto: Lic. Jorge Quispe, trabajador social (Administradora Rimay)'], [46, staff.admin, 'estado', 'Derivado a Policía. Contacto: Lic. Jorge Quispe, trabajador social (Administradora Rimay)']] },
    { code: 'RI-776301', alias: 'K.', risk: false, types: ['psicologica'], place: 'Internet o redes sociales', support: ['psico', 'info'],
      method: 'whatsapp', value: '933118640', schedule: 'Fines de semana', status: 'cerrado', derived: 'cem', created: 96, firstContact: 90,
      contact: 'Abg. Lucía Paredes, abogada del CEM',
      events: [[96, null, 'creado', 'Reporte recibido.'], [90, staff.admin, 'estado', 'Contactado. Contacto: Abg. Lucía Paredes, abogada del CEM (Administradora Rimay)'], [80, staff.admin, 'estado', 'Derivado a CEM. Contacto: Abg. Lucía Paredes, abogada del CEM (Administradora Rimay)'], [40, staff.admin, 'estado', 'Cerrado. Contacto: Abg. Lucía Paredes, abogada del CEM (Administradora Rimay)']] },
    { code: 'RI-640827', alias: 'Lidia', risk: false, types: ['psicologica', 'economica'], place: 'Vivienda', support: ['info', 'psico'],
      method: 'whatsapp', value: '966420915', schedule: 'Martes y jueves, de 10 a 12 m.', status: 'derivado', derived: 'otra', entity: 'DEMUNA de Villa El Salvador', created: 70, firstContact: 66,
      contact: 'Lic. Rocío Huamaní, trabajadora social',
      events: [[70, null, 'creado', 'Reporte recibido.'], [66, staff.admin, 'estado', 'Contactado. Contacto: Lic. Rocío Huamaní, trabajadora social (Administradora Rimay)'], [60, staff.admin, 'estado', 'Derivado a DEMUNA de Villa El Salvador. Contacto: Lic. Rocío Huamaní, trabajadora social (Administradora Rimay)']] },
  ];

  // 20 anónimos: física 4, psicológica 9, sexual 2, económica 3, no sé 2; repartidos en los últimos 7 días.
  const anonTypes = [
    ...Array(4).fill('fisica'), ...Array(9).fill('psicologica'), ...Array(2).fill('sexual'),
    ...Array(3).fill('economica'), ...Array(2).fill('no_se'),
  ];
  const anonHours = [3, 8, 20, 26, 30, 44, 50, 54, 70, 75, 80, 98, 100, 104, 120, 126, 130, 140, 150, 160];
  const ANON = anonTypes.map((t, i) => ({ code: 'RI-9' + String(i).padStart(5, '0'), type: t, created: anonHours[i] }));

  // Borra solo los datos de demostración (is_demo = true); persons, eventos y consentimientos caen en cascada.
  ok(await db().from('reports').delete().eq('is_demo', true), 'limpiar datos de demo');

  for (const c of CASES) {
    const r = ok(await db().from('reports').insert({
      code: c.code, is_demo: true, is_anonymous: false, device_safe: 'si', danger: c.risk ? 'si' : 'no', has_risk: c.risk,
      violence_types: c.types, place: c.place, description: c.description || null, support_types: c.support, status: c.status,
      derived_to: c.derived || null, derived_entity: c.entity || null, contact_person: c.contact || null,
      first_contact_at: c.firstContact ? ago(c.firstContact) : null, created_at: ago(c.created),
    }).select('id').single(), 'caso ' + c.code);
    ok(await db().from('persons').insert({ report_id: r.id, alias: c.alias, contact_method: c.method, contact_value: c.value, safe_schedule: c.schedule }), 'persona');
    ok(await db().from('case_events').insert(c.events.map(([h, actor, type, detail]) => ({ report_id: r.id, actor_id: actor, event_type: type, detail, created_at: ago(h) }))), 'eventos');
    ok(await db().from('consents').insert([
      { report_id: r.id, purpose: 'registro_reporte', granted: true },
      { report_id: r.id, purpose: 'contacto', granted: true },
    ]), 'consentimientos');
  }
  console.log(`✓ ${CASES.length} casos con contacto`);

  const anonRows = ok(await db().from('reports').insert(ANON.map((a) => ({
    code: a.code, is_demo: true, is_anonymous: true, device_safe: 'si', danger: 'no', violence_types: [a.type], created_at: ago(a.created),
  }))).select('id'), 'anónimos');
  ok(await db().from('case_events').insert(anonRows.map((r) => ({ report_id: r.id, event_type: 'creado', detail: 'Reporte recibido.' }))), 'eventos anónimos');
  ok(await db().from('consents').insert(anonRows.map((r) => ({ report_id: r.id, purpose: 'registro_reporte', granted: true }))), 'consentimientos anónimos');
  console.log(`✓ ${ANON.length} reportes anónimos`);
  console.log('Listo. Cuenta del panel: admin@rimay.pe — contraseña rimay2026');
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
