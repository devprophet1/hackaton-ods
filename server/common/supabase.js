import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { HttpError } from './errors.js';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
let admin;

// Cliente con service_role: solo en el backend.
export function db() {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new HttpError(503, 'Falta configurar Supabase en el servidor.');
  }
  admin ??= createClient(config.supabaseUrl, config.supabaseServiceKey, opts);
  return admin;
}

// Cliente con anon key para iniciar sesión (signInWithPassword).
export function authClient() {
  return createClient(config.supabaseUrl, config.supabaseAnonKey || config.supabaseServiceKey, opts);
}

// Lanza HttpError si Supabase devolvió error.
export function check({ data, error }) {
  if (error) throw new HttpError(500, 'Error de base de datos: ' + error.message);
  return data;
}
