import { db, authClient, check } from '../../common/supabase.js';
import { HttpError } from '../../common/errors.js';

export const toUser = (s) => ({ id: s.id, fullName: s.full_name, role: s.role, institution: s.institution });

export async function login(email, password) {
  if (!email || !password) throw new HttpError(400, 'Escribe tu correo y contraseña.');
  db(); // valida que Supabase esté configurado
  const { data, error } = await authClient().auth.signInWithPassword({
    email: String(email).trim().toLowerCase(),
    password: String(password),
  });
  if (error || !data?.session) throw new HttpError(401, 'Correo o contraseña incorrectos. Usa una cuenta de demostración.');
  const staff = check(await db().from('staff').select('id, full_name, role, institution').eq('id', data.user.id).maybeSingle());
  if (!staff) throw new HttpError(403, 'Tu cuenta no tiene acceso al panel.');
  return { token: data.session.access_token, user: toUser(staff) };
}

export async function listStaff() {
  const rows = check(await db().from('staff').select('id, full_name, role').order('full_name'));
  return rows.map((s) => ({ id: s.id, fullName: s.full_name, role: s.role }));
}
