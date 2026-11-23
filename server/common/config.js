export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,

  // Proveedor de IA: "openrouter" (predeterminado), "openai" o "gemini".
  aiProvider: process.env.AI_PROVIDER || 'openrouter',
  // Esfuerzo de razonamiento para modelos gpt-5*: el más bajo disponible es "none".
  reasoningEffort: process.env.AI_REASONING_EFFORT || 'none',
  // Opcional: similitud mínima del RAG (por defecto 0,3 con OpenAI/OpenRouter y 0,5 con Gemini).
  minSimilarity: process.env.AI_MIN_SIMILARITY,
  // Se envía como HTTP-Referer a OpenRouter (opcional). En Vercel se usa el dominio de producción.
  appUrl: process.env.APP_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:5173'),

  openrouterKey: process.env.OPENROUTER_API_KEY,
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  openrouterEmbeddingModel: process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-3-small',
  openrouterChatModel: process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-5.4-mini',

  openaiKey: process.env.OPENAI_API_KEY,
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-5.4-mini',

  geminiKey: process.env.GEMINI_API_KEY,
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-3.6-flash',
};
