export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-3.6-flash',
};
