// Importa traducciones (qu y ay) de un JSON con la misma estructura que public/textos.json.
// Solo rellena campos vacíos; nunca cambia id, contexto ni es. Avisa si faltan números o nombres propios.
// Uso: npm run i18n:importar -- docs/traducciones/traducido.json
//      npm run i18n:importar -- docs/traducciones/traducido.json --sobrescribir   (reemplaza también las existentes)
import { readFile, writeFile } from 'node:fs/promises';

const file = process.argv[2];
const overwrite = process.argv.includes('--sobrescribir');
if (!file) { console.error('✗ Indica el archivo traducido. Ej.: npm run i18n:importar -- docs/traducciones/traducido.json'); process.exit(1); }

const SRC = new URL('../public/textos.json', import.meta.url);
const raw = await readFile(SRC, 'utf8');
const all = JSON.parse(raw);
const incoming = JSON.parse((await readFile(file, 'utf8')).replace(/^﻿/, ''));
if (!Array.isArray(incoming)) { console.error('✗ El archivo debe ser un arreglo JSON.'); process.exit(1); }

// Lo que debe conservarse igual en la traducción.
const KEEP = ['Línea 100', 'Línea 113', 'Chat 100', 'Rimay', 'Ley N.º 30364', 'Centro de Emergencia Mujer', 'Central Única de Denuncias',
  'WhatsApp', 'Google', 'HackODS UA 2026', 'Villa El Salvador', '{medio}', '[IDIOMA]', 'chat100.warminan.gob.pe'];
const byId = new Map(all.map((x) => [x.id, x]));
const warnings = [];
let filled = 0;
let skipped = 0;

for (const t of incoming) {
  const cur = byId.get(t.id);
  if (!cur) { warnings.push(`id ${t.id}: no existe en textos.json (se ignora)`); continue; }
  if (t.es !== cur.es) { warnings.push(`id ${t.id}: el texto en español no coincide (se ignora el registro)`); skipped++; continue; }
  for (const lang of ['qu', 'ay']) {
    const v = typeof t[lang] === 'string' ? t[lang].trim() : '';
    if (!v) continue;
    if (cur[lang]?.trim() && !overwrite) continue;
    for (const n of cur.es.match(/\b\d+\b/g) || []) if (!v.includes(n)) warnings.push(`id ${t.id} ${lang}: falta el número ${n}`);
    for (const k of KEEP) if (cur.es.includes(k) && !v.includes(k)) warnings.push(`id ${t.id} ${lang}: falta «${k}»`);
    cur[lang] = v;
    filled++;
  }
}

const eol = raw.includes('\r\n') ? '\r\n' : '\n';
await writeFile(SRC, JSON.stringify(all, null, 2).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
const empty = (v) => !v || !String(v).trim();
console.log(`✓ ${filled} traducciones importadas${skipped ? ` · ${skipped} registros ignorados` : ''}`);
console.log(`Quedan sin quechua: ${all.filter((x) => empty(x.qu)).length} · sin aimara: ${all.filter((x) => empty(x.ay)).length}`);
if (warnings.length) console.log('Revisar:\n  ' + warnings.join('\n  '));
