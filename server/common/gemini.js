import { config } from './config.js';
import { HttpError } from './errors.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const DIM = 768;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Reintenta ante saturación temporal de Gemini (429/503): hasta 3 intentos.
async function call(path, body) {
  if (!config.geminiKey) throw new HttpError(503, 'Falta configurar GEMINI_API_KEY en el servidor.');
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.geminiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json;
    if ((res.status === 429 || res.status === 503) && attempt < 3) { await sleep(1500 * attempt); continue; }
    throw new HttpError(502, 'Error de Gemini: ' + (json.error?.message || res.status));
  }
}

// gemini-embedding-001 a 768 dimensiones: Google pide normalizar el vector.
function normalize(v) {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

// taskType: RETRIEVAL_DOCUMENT o RETRIEVAL_QUERY. Lotes de hasta 100.
export async function embed(texts, taskType) {
  const model = config.embeddingModel;
  const out = [];
  for (let i = 0; i < texts.length; i += 100) {
    const requests = texts.slice(i, i + 100).map((text) => ({
      model: 'models/' + model,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: DIM,
    }));
    const json = await call(`${model}:batchEmbedContents`, { requests });
    out.push(...json.embeddings.map((e) => normalize(e.values)));
  }
  return out;
}

export async function generate(systemPrompt, userText) {
  const json = await call(`${config.chatModel}:generateContent`, {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
  });
  return (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
}
