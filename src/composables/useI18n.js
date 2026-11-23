import { ref } from 'vue';

// Diccionario public/textos.json ({ id, contexto, es, qu, ay }). t() busca por el texto en español
// y, si la traducción está vacía o no existe, devuelve el español.
const LANGS = ['es', 'qu', 'ay'];
export const LANG_NAME = { es: 'español', qu: 'quechua', ay: 'aimara' };

function readPref() {
  try { return localStorage.getItem('rimay.lang'); } catch { return null; }
}

const lang = ref(LANGS.includes(readPref()) ? readPref() : 'es');
const dict = ref(new Map());
let loading;

function load() {
  loading ??= fetch('/textos.json')
    .then((r) => r.json())
    .then((arr) => { dict.value = new Map(arr.map((x) => [x.es, x])); })
    .catch(() => {});
  return loading;
}

export function t(es, vars) {
  let s = es;
  if (lang.value !== 'es') {
    const tr = dict.value.get(es)?.[lang.value];
    if (tr && tr.trim()) s = tr;
  }
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v).replaceAll(`[${k}]`, v);
  return s;
}

export function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang.value = l;
  document.documentElement.lang = l;
  // Solo la preferencia de idioma se guarda en el navegador.
  try { localStorage.setItem('rimay.lang', l); } catch { /* sin almacenamiento */ }
}

export function useI18n() {
  load();
  document.documentElement.lang = lang.value;
  return { lang, t, setLang };
}
