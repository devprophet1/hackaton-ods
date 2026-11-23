import { ref, computed } from 'vue';
import { api, ApiError } from './useApi.js';

// Sesión del panel en sessionStorage (se borra al cerrar la pestaña).
const KEY = 'rimay.admin';

function read() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch { return null; }
}

const session = ref(read());
export const user = computed(() => session.value?.user || null);
export const isLoggedIn = computed(() => !!session.value?.token);

let onExpired = () => {};
export const setOnExpired = (fn) => { onExpired = fn; };

export async function login(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } });
  session.value = data;
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function logout() {
  session.value = null;
  sessionStorage.removeItem(KEY);
}

// Igual que api(), con el token. Si la sesión expiró, cierra sesión y avisa al router.
export async function authApi(path, opts = {}) {
  try {
    return await api(path, { ...opts, token: session.value?.token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) { logout(); onExpired(); }
    throw err;
  }
}

export function useAuth() {
  return { user, isLoggedIn, login, logout, authApi };
}
