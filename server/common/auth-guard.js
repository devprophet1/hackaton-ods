import { db } from './supabase.js';
import { HttpError } from './errors.js';

// Valida el token de Supabase y carga la fila de staff en req.staff.
export async function requireStaff(req, _res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Inicia sesión para continuar.');
  const { data, error } = await db().auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
  const { data: staff } = await db().from('staff').select('id, full_name, role, institution').eq('id', data.user.id).maybeSingle();
  if (!staff) throw new HttpError(403, 'Tu cuenta no tiene acceso al panel.');
  req.staff = staff;
  next();
}
