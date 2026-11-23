import { onMounted, onBeforeUnmount } from 'vue';
import { closeMenu } from './useUi.js';

const SAFE = 'https://www.google.com/';

// Oculta todo al instante y reemplaza la página en el historial. Sin pantallas intermedias.
export function quickExit() {
  document.body.style.visibility = 'hidden';
  try { window.top.location.replace(SAFE); } catch { window.location.replace(SAFE); }
}

// Esc tres veces en menos de 1,2 s activa Salir rápido (Esc también cierra el menú).
export function useQuickExit() {
  let times = [];
  const onKey = (e) => {
    if (e.key !== 'Escape') return;
    closeMenu();
    const now = Date.now();
    times = times.filter((t) => now - t < 1200);
    times.push(now);
    if (times.length >= 3) { times = []; quickExit(); }
  };
  onMounted(() => document.addEventListener('keydown', onKey));
  onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
  return { quickExit };
}
