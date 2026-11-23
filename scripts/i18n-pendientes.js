// Exporta los textos que aún no tienen quechua (qu) o aimara (ay) a docs/traducciones/pendientes.json.
// Ese archivo se entrega a quien traduce (o a ChatGPT) junto con docs/traducciones/PROMPT.md.
// Uso: npm run i18n:pendientes
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SRC = new URL('../public/textos.json', import.meta.url);
const OUT_DIR = new URL('../docs/traducciones/', import.meta.url);

const all = JSON.parse(await readFile(SRC, 'utf8'));
const empty = (v) => !v || !String(v).trim();
const pending = all.filter((x) => empty(x.qu) || empty(x.ay));

await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL('pendientes.json', OUT_DIR), JSON.stringify(pending, null, 2) + '\n');

console.log(`Total: ${all.length} textos`);
console.log(`Sin quechua: ${all.filter((x) => empty(x.qu)).length} · Sin aimara: ${all.filter((x) => empty(x.ay)).length}`);
console.log(`Pendientes (falta qu o ay): ${pending.length} → docs/traducciones/pendientes.json`);
