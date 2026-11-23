// Proveedor de IA común: embeddings y chat. Elige OpenRouter, OpenAI o Gemini según AI_PROVIDER.
// Ningún módulo ni script debe usar los SDK directamente: todo pasa por aquí.
// TODO: los embeddings no son compatibles entre proveedores; al cambiar AI_PROVIDER hay que ejecutar npm run kb:seed.
import OpenAI from 'openai';
import { config } from './config.js';
import { HttpError } from './errors.js';
import * as gemini from './gemini.js';

export const EMBEDDING_DIM = 768;
const MAX_OUTPUT_TOKENS = 300;
const PROVIDERS = ['openrouter', 'openai', 'gemini'];

// Oculta cualquier cosa con forma de clave en los mensajes de error.
export function redact(msg) {
  return String(msg ?? '')
    .replace(/sk-[A-Za-z0-9_\-]{8,}/g, 'sk-***')
    .replace(/AIza[0-9A-Za-z_\-]{10,}/g, 'AIza***')
    .replace(/(sb_secret_|sb_publishable_)[A-Za-z0-9_\-]+/g, '$1***')
    .replace(/eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, 'eyJ***');
}

export function provider() {
  return (config.aiProvider || 'openrouter').toLowerCase();
}

export function models() {
  const p = provider();
  if (p === 'gemini') return { embedding: config.geminiEmbeddingModel, chat: config.geminiChatModel };
  if (p === 'openai') return { embedding: config.openaiEmbeddingModel, chat: config.openaiChatModel };
  return { embedding: config.openrouterEmbeddingModel, chat: config.openrouterChatModel };
}

// Similitud mínima para usar un fragmento en el RAG. Cada modelo de embeddings tiene su escala:
// con text-embedding-3-small las preguntas fuera de tema quedan ≤ 0,28 y las del tema ≥ 0,35;
// con gemini-embedding-001 se calibró en 0,5. Se puede ajustar con AI_MIN_SIMILARITY.
export function minSimilarity() {
  const env = Number.parseFloat(config.minSimilarity);
  if (Number.isFinite(env)) return env;
  return provider() === 'gemini' ? 0.5 : 0.3;
}

// Variables necesarias para el proveedor activo (las usa scripts/check-env.js).
export function requiredEnv() {
  const p = provider();
  if (p === 'gemini') return ['GEMINI_API_KEY'];
  if (p === 'openai') return ['OPENAI_API_KEY'];
  return ['OPENROUTER_API_KEY'];
}

// Clientes con el SDK oficial openai. OpenRouter es compatible con la API de OpenAI.
const clients = {};
function client(p) {
  if (clients[p]) return clients[p];
  if (p === 'openrouter') {
    if (!config.openrouterKey) throw new HttpError(503, 'Falta configurar OPENROUTER_API_KEY en el servidor.');
    clients[p] = new OpenAI({
      apiKey: config.openrouterKey,
      baseURL: config.openrouterBaseUrl,
      timeout: 60_000,
      maxRetries: 2,
      // Encabezados opcionales con los que OpenRouter identifica la app.
      defaultHeaders: { 'HTTP-Referer': config.appUrl, 'X-Title': 'Rimay' },
    });
  } else {
    if (!config.openaiKey) throw new HttpError(503, 'Falta configurar OPENAI_API_KEY en el servidor.');
    clients[p] = new OpenAI({ apiKey: config.openaiKey, timeout: 60_000, maxRetries: 2 });
  }
  return clients[p];
}

function apiError(p, err) {
  const name = p === 'openrouter' ? 'OpenRouter' : 'OpenAI';
  const status = err?.status ? ` (${err.status})` : '';
  return new HttpError(502, redact(`Error de ${name}${status}: ${err?.message || err}`));
}

// Modelos de razonamiento (gpt-5*, o*): aceptan esfuerzo de razonamiento y no aceptan temperature.
const isReasoningModel = (m) => /^(openai\/)?(gpt-5|o\d)/i.test(m);

// kind: "document" o "query". Devuelve vectores de exactamente 768 dimensiones.
export async function embed(texts, kind = 'document') {
  if (!Array.isArray(texts) || !texts.length) return [];
  if (kind !== 'document' && kind !== 'query') throw new Error('kind debe ser "document" o "query".');
  const p = provider();

  let vectors;
  if (p === 'gemini') {
    vectors = await gemini.embed(texts, kind === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT');
  } else {
    // text-embedding-3 no distingue documento/consulta. Lotes de 100 textos.
    vectors = [];
    for (let i = 0; i < texts.length; i += 100) {
      try {
        const res = await client(p).embeddings.create({
          model: models().embedding,
          input: texts.slice(i, i + 100),
          dimensions: EMBEDDING_DIM,
          encoding_format: 'float',
        });
        if (!Array.isArray(res?.data)) throw new Error('respuesta de embeddings sin datos');
        vectors.push(...[...res.data].sort((a, b) => a.index - b.index).map((d) => d.embedding));
      } catch (err) {
        throw err instanceof HttpError ? err : apiError(p, err);
      }
    }
  }

  if (vectors.length !== texts.length || vectors.some((v) => v?.length !== EMBEDDING_DIM)) {
    throw new HttpError(502, `El proveedor de IA no devolvió vectores de ${EMBEDDING_DIM} dimensiones.`);
  }
  return vectors;
}

// Devuelve el texto de la respuesta.
export async function chat(systemPrompt, userMessage) {
  const p = provider();
  if (p === 'gemini') return gemini.generate(systemPrompt, userMessage);

  const model = models().chat;
  try {
    if (p === 'openrouter') {
      // Chat Completions de OpenRouter: max_tokens y reasoning.effort (el más bajo: "none").
      const params = {
        model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        max_tokens: MAX_OUTPUT_TOKENS,
      };
      if (isReasoningModel(model)) params.reasoning = { effort: config.reasoningEffort, exclude: true };
      const res = await client(p).chat.completions.create(params);
      return (res.choices?.[0]?.message?.content || '').trim();
    }
    // OpenAI directo: API Responses.
    const params = { model, instructions: systemPrompt, input: userMessage, max_output_tokens: MAX_OUTPUT_TOKENS };
    if (isReasoningModel(model)) params.reasoning = { effort: config.reasoningEffort };
    const res = await client(p).responses.create(params);
    return (res.output_text || '').trim();
  } catch (err) {
    throw err instanceof HttpError ? err : apiError(p, err);
  }
}

export { PROVIDERS };
