import { db, check } from '../../common/supabase.js';
import { embed, chat as aiChat, minSimilarity } from '../../common/ai.js';

// ── Riesgo: se detecta antes de todo y responde sin llamar al modelo ──────────────────────────
// Crisis personal (ideas de hacerse daño): tarjeta con 105, Línea 100 y Línea 113 opción 5 (Minsa).
const CRISIS_TERMS = ['quiero morir', 'me quiero morir', 'quitarme la vida', 'no quiero vivir', 'no quiero seguir viviendo',
  'suicid', 'matarme', 'acabar con mi vida', 'hacerme dano', 'quiero desaparecer', 'no vale la pena vivir'];
const RISK_TERMS = ['matar', 'me mata', 'me va a', 'miedo', 'peligro', 'golpea', 'golpe', 'arma', 'cuchillo', 'ahora mismo', 'amenaz'];
const RISK_ANSWER = 'Lo que cuentas es serio y tu seguridad es lo primero. Si estás en peligro ahora, llama al 105 o a la Línea 100.';
const CRISIS_ANSWER = 'Siento mucho que estés pasando por esto, y me alegra que lo hayas escrito. No tienes que atravesarlo a solas: puedes hablar ahora mismo, gratis y a cualquier hora, con la Línea 113 opción 5 (salud mental del Minsa) o con la Línea 100. Si estás en peligro inmediato, llama al 105.';

// ── Respuestas sin modelo ─────────────────────────────────────────────────────────────────────
const START = ['¿Dónde pido ayuda?', '¿Cómo denuncio?', '¿Qué es la violencia psicológica?'];
const SMALL_TALK = {
  saludo: {
    answer: 'Hola, qué bueno que escribas. Estoy aquí para escucharte y orientarte. ¿Quieres contarme qué está pasando o tienes alguna pregunta?',
    suggestions: START,
  },
  gracias: {
    answer: 'Gracias a ti por confiar en este espacio. Si quieres seguir conversando o tienes otra duda, aquí estoy.',
    suggestions: ['¿Dónde pido ayuda?', '¿Cómo armo un plan de seguridad?'],
  },
  despedida: {
    answer: 'Cuídate mucho. Puedes volver cuando lo necesites, y si quieres hablar con alguien, la Línea 100 te atiende gratis las 24 horas.',
    suggestions: [],
  },
  identidad: {
    answer: 'Soy el asistente de Rimay, un programa de orientación, no una persona. Puedo explicarte tus derechos y a dónde acudir; si prefieres hablar con alguien, la Línea 100 te atiende gratis las 24 horas. ¿En qué te puedo ayudar?',
    suggestions: START,
  },
};
const OFF_TOPIC = {
  answer: [
    'Eso queda fuera de lo que puedo responder. Estoy aquí para orientarte sobre violencia, tus derechos y dónde pedir ayuda. Por ejemplo, puedo contarte:',
    '- Cómo reconocer si algo es violencia',
    '- Cómo presentar una denuncia',
    '- Dónde pedir ayuda gratuita',
    '¿Sobre cuál quieres saber?',
  ].join('\n'),
  suggestions: ['¿Cómo sé si es violencia?', '¿Cómo denuncio?', '¿Dónde pido ayuda?'],
};
const NO_DATA = {
  answer: [
    'No tengo ese dato exacto, pero puedo ayudarte con:',
    '- Cómo presentar una denuncia',
    '- Qué hace un Centro de Emergencia Mujer',
    '- Cómo armar un plan de seguridad',
    'Si prefieres hablar con una persona, la Línea 100 te orienta gratis las 24 horas.',
  ].join('\n'),
  suggestions: ['¿Cómo denuncio?', '¿Qué es un CEM?', '¿Cómo armo un plan de seguridad?'],
};
// Sugerencias de respaldo según el documento más relevante, por si el modelo no las da.
const BY_DOC = {
  'Cómo presentar una denuncia': ['¿Quién puede denunciar?', '¿Qué medidas de protección puedo pedir?'],
  'Ley N.º 30364: tipos de violencia y derechos': ['¿Qué tipos de violencia hay?', '¿Cuáles son mis derechos?'],
  'Centro de Emergencia Mujer (CEM)': ['¿Qué servicios da un CEM?', '¿Cómo llego a un CEM?'],
  'Plan de seguridad': ['¿Cómo armo un plan de seguridad?', '¿Dónde pido ayuda?'],
  'Cómo ayudar a alguien que vive violencia': ['¿Qué le digo a alguien que vive violencia?', '¿Qué debo evitar decir?'],
  'Línea 100 y Chat 100': ['¿Qué es la Línea 100?', '¿Cómo uso el Chat 100?'],
  'Directorio de ayuda': ['¿Dónde pido ayuda?', '¿Qué es un CEM?'],
};

export const SYSTEM_PROMPT = [
  'Eres el asistente de orientación de Rimay, una plataforma de apoyo frente a la violencia en Villa El Salvador, Lima, Perú. Conversas como una orientadora que escucha: cercana, tranquila y respetuosa.',
  '',
  'Reglas de contenido:',
  '1. Cada afirmación informativa debe salir del CONTEXTO. Si el CONTEXTO no lo dice, no lo agregues: no completes con conocimiento general ni detalles prácticos (con quién ir, qué llevar, horarios, plazos, costos) que no estén escritos ahí. Si falta información, dilo con naturalidad («No tengo ese dato exacto…») y ofrece lo que sí puedes explicar. Excepción: los canales fijos de derivación (105, Línea 100, Chat 100 https://chat100.warminan.gob.pe y Centro de Emergencia Mujer) siempre puedes mencionarlos.',
  '2. Usa los tipos de violencia de la Ley N.º 30364 (física, psicológica, sexual, económica o patrimonial) solo para explicar con cuidado («eso puede corresponder a…»); nunca diagnostiques ni califiques el riesgo.',
  '3. Si la persona cuenta lo que vive o se desahoga: primero valida lo que siente («Lo que cuentas es importante y no es tu culpa»), muestra que escuchas y termina con una sola pregunta sobre qué necesita. Nunca ofrezcas terapia ni evaluación clínica.',
  '4. Nunca culpes a la persona ni le digas lo que «debería» hacer: ofrece opciones.',
  '5. Nunca pidas datos personales ni que repita su relato. Si hay riesgo inmediato, indica llamar al 105.',
  '6. Usa la CONVERSACIÓN previa para entender preguntas de seguimiento («¿y eso es violencia?», «¿y dónde queda?»).',
  '',
  'Forma:',
  '7. Trata de «tú». Frases cortas y cálidas. Responde en 2 a 4 frases; usa una lista con guiones solo si hay pasos o varias opciones.',
  '8. Termina con como máximo una pregunta abierta o un siguiente paso.',
  '9. No repitas avisos en cada respuesta: menciona la Línea 100 solo cuando sea útil o la persona necesite a alguien.',
  '10. Texto plano, sin Markdown: sin asteriscos, almohadillas ni negritas. Nunca menciones las palabras «CONTEXTO» ni «MODO» a la persona.',
  '11. Al final, en una línea aparte, escribe «SUGERENCIAS:» seguido de 2 o 3 preguntas cortas (máximo 7 palabras cada una) que la persona podría hacer a continuación, separadas por «|». Deben poder responderse con temas de orientación sobre violencia, derechos, denuncia, CEM, Línea 100 o plan de seguridad.',
].join('\n');

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = (m) => m.replace(/[^a-zñ0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

// El widget muestra texto plano: quita marcas de Markdown que el modelo pueda añadir.
const plain = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/^#{1,6}\s+/gm, '').trim();

export function riskType(message) {
  const m = normalize(message);
  if (CRISIS_TERMS.some((t) => m.includes(t))) return 'crisis';
  if (RISK_TERMS.some((t) => m.includes(t))) return 'violencia';
  return null;
}
export const hasRisk = (message) => !!riskType(message);

// Intención por reglas simples (rápido y sin costo).
const RELATO = /\b(me (grita|gritan|grito|pega|pego|golpeo|insulta|insulto|humilla|controla|revisa|amenaza|empuja|empujo|obliga|prohibe|quita|cela|persigue|sigue|encierra|siento|duele)|mi (pareja|esposo|esposa|novio|novia|enamorado|enamorada|conviviente|ex|papa|mama|padre|madre|padrastro|madrastra|hermano|hermana|jefe|hijo|hija)|no se que hacer|estoy (mal|triste|cansad[ao]|sol[ao]|asustad[ao]|confundid[ao]|hart[ao]|agotad[ao])|me siento|tengo verguenza|nadie me cree|no puedo mas)\b/;

export function intent(message) {
  const m = normalize(message);
  const n = words(m).length;
  if (/(quien eres|que eres|eres (una |un )?(persona|humana|humano|real|robot|bot|ia|maquina)|con quien hablo|eres de verdad)/.test(m)) return 'identidad';
  if (n <= 4 && /^\W*(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|alo)\b/.test(m)) return 'saludo';
  if (n <= 6 && /\b(gracias|te agradezco)\b/.test(m)) return 'gracias';
  if (n <= 5 && /^\W*(chau|chao|adios|hasta luego|hasta pronto|nos vemos|bye)\b/.test(m)) return 'despedida';
  if (RELATO.test(m)) return 'relato';
  return 'pregunta';
}

// Separa la línea «SUGERENCIAS: a | b | c» del texto de la respuesta.
function splitSuggestions(text) {
  const match = text.match(/\n?\s*SUGERENCIAS?\s*:\s*([^\n]+)\s*$/i);
  if (!match) return { answer: text, suggestions: [] };
  const suggestions = match[1].split('|').map((s) => s.trim().replace(/^[-•\s]+/, '')).filter((s) => s && s.length <= 70).slice(0, 3);
  return { answer: text.slice(0, match.index).trim(), suggestions };
}

// Pregunta de seguimiento: «¿y qué puedo hacer?», «¿eso es violencia?», «¿y dónde queda?».
const FOLLOW_UP = /^\W*(y|entonces|pero|o sea|osea)\b|\b(eso|esto|aquello|ahi|alli|donde queda|en ese caso)\b/;

// Busca con la pregunta y, si es de seguimiento, también con lo último que contó la persona.
async function retrieve(q, history) {
  const prevUser = history.filter((m) => m.role === 'user').slice(-2).map((m) => m.content).join('\n');
  const queries = prevUser && FOLLOW_UP.test(normalize(q)) ? [q, `${prevUser}\n${q}`] : [q];
  const vectors = await embed(queries, 'query');
  const results = await Promise.all(vectors.map(async (v) =>
    check(await db().rpc('match_chunks', { query_embedding: v, match_count: 5, min_similarity: 0 })) || []));
  const byId = new Map();
  for (const r of results.flat()) if (!byId.has(r.id) || byId.get(r.id).similarity < r.similarity) byId.set(r.id, r);
  const all = [...byId.values()].sort((a, b) => b.similarity - a.similarity);
  return { chunks: all.filter((c) => c.similarity >= minSimilarity()).slice(0, 5), top: all[0]?.similarity || 0 };
}

const reply = (answer, suggestions = [], extra = {}) => ({ answer, sources: [], risk: false, suggestions, ...extra });

export async function chat(message, rawHistory = []) {
  const q = typeof message === 'string' ? message.trim().slice(0, 1000) : '';
  if (!q) return reply('Escribe tu pregunta o cuéntame qué está pasando, y te oriento.', START);
  const history = (Array.isArray(rawHistory) ? rawHistory : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-6);

  // 1. Riesgo: respuesta fija, sin llamar al modelo.
  const risk = riskType(q);
  if (risk === 'crisis') return { answer: CRISIS_ANSWER, sources: [], risk: true, riskType: 'crisis', suggestions: [] };
  if (risk) return { answer: RISK_ANSWER, sources: [], risk: true, riskType: 'violencia', suggestions: [] };

  // 2. Conversación breve: respuesta cálida sin buscar en la base de conocimiento.
  const kind = intent(q);
  if (SMALL_TALK[kind]) return reply(SMALL_TALK[kind].answer, SMALL_TALK[kind].suggestions);

  // 3. Recuperación (también usa la conversación para preguntas de seguimiento).
  const { chunks, top } = await retrieve(q, history);

  // 4. Sin contexto y no es un relato: opciones en lugar de «no sé».
  if (!chunks.length && kind !== 'relato') {
    const fallback = top < 0.2 ? OFF_TOPIC : NO_DATA;
    return reply(fallback.answer, fallback.suggestions);
  }

  // 5. Modelo con contexto (si lo hay) y la conversación previa.
  const context = chunks.length
    ? chunks.map((c, i) => `[${i + 1}] ${c.document_title}\n${c.content}`).join('\n\n')
    : '(sin fragmentos relevantes: no des datos informativos, solo escucha y ofrece canales de derivación)';
  const mode = kind === 'relato'
    ? 'MODO: relato o desahogo. Valida, escucha y termina con una sola pregunta sobre qué necesita. Usa el CONTEXTO solo si aporta (por ejemplo, para nombrar con cuidado el tipo de violencia que describe).'
    : 'MODO: pregunta informativa. Si el CONTEXTO responde la pregunta, aunque sea en parte, responde directo y sin aclaraciones. Solo si el punto concreto que se pregunta no aparece en el CONTEXTO (por ejemplo, un dato, requisito o lugar específico), no lo supongas ni lo deduzcas: empieza con «No tengo ese dato exacto» y ofrece lo relacionado que sí está.';
  const raw = await aiChat(SYSTEM_PROMPT, `${mode}\n\nCONTEXTO:\n${context}\n\nMENSAJE:\n${q}`, history);
  const { answer, suggestions } = splitSuggestions(plain(raw || ''));

  // 6. Fuentes únicas: solo documentos cuyos fragmentos superaron el umbral.
  const sources = [];
  for (const c of chunks) {
    if (!sources.some((s) => s.title === c.document_title)) sources.push({ title: c.document_title, source: c.source });
  }
  return {
    answer: answer || NO_DATA.answer,
    sources,
    risk: false,
    suggestions: suggestions.length ? suggestions : (BY_DOC[chunks[0]?.document_title] || NO_DATA.suggestions),
  };
}
