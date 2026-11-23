# Rimay

**Equipo:** [Nombre del equipo] · **Integrantes:** [Integrantes]

Rimay («hablar» en quechua) es una plataforma web para el desafío **Prevención de violencia (ODS 5: igualdad de género)** del HackODS UA 2026. Permite reportar casos de violencia en Villa El Salvador de forma segura, recibir orientación inmediata de un asistente con RAG y, si la persona lo pide, ser contactada por una institución aliada que hace el seguimiento desde un panel `/admin`.

## Qué incluye

- **Web pública:** inicio, «Cómo funciona», «Infórmate», reporte en 3 pasos, preguntas frecuentes, «Nosotros», asistente flotante y selector de idioma (español, quechua y aimara; traducciones preliminares).
- **Seguridad de la víctima:** botón «Salir rápido» siempre visible (también con Esc tres veces), anónimo por defecto, ningún campo obligatorio, nunca se pide DNI y nada del reporte se guarda en el navegador.
- **Asistente con RAG:** responde con documentos oficiales (OpenRouter + pgvector) y detecta frases de riesgo antes de llamar al modelo.
- **Panel `/admin`:** bandeja de casos con riesgo primero, contacto enmascarado con acceso registrado, asignación, estados, notas, dashboard y base de conocimiento.

## Tecnologías y arquitectura

| Capa | Tecnología |
| --- | --- |
| Frontend | Vue 3 + Vite + Vue Router (JavaScript, sin librerías de UI) |
| Backend | Node.js + Express 5, monolito modular (`reports`, `rag`, `auth`, `cases`, `stats`, `kb`) |
| Datos | Supabase: Postgres + pgvector + Auth |
| IA | OpenRouter (SDK `openai`): `openai/text-embedding-3-small` (768 dim.) y `openai/gpt-5.4-mini`. OpenAI directo y Gemini quedan como alternativas (`AI_PROVIDER`) |
| Despliegue | Vercel: estáticos de Vite + Express como una función bajo `/api` |

```
Navegador ──► Vercel
              ├─ /*      → dist/ (Vue, rutas resueltas con index.html)
              └─ /api/*  → api/index.js → server/app.js (Express) ──► Supabase y OpenRouter
```

El frontend solo llama a rutas relativas `/api/...`; nunca habla directo con Supabase. La especificación completa está en [specs/rimay-mvp.md](specs/rimay-mvp.md).

## Instalación local

Requisitos: Node.js 22 o superior, un proyecto de Supabase y una clave de OpenRouter (o de OpenAI o Gemini).

```bash
npm install
cp .env.example .env        # completa las variables (ver abajo)
npm run check               # primero: valida claves, modelos de IA y Supabase (todo debe salir en ✓)
npx supabase login
npx supabase link --project-ref <REF_DEL_PROYECTO>
npx supabase db push        # aplica supabase/migrations/
npm run seed                # usuarios de demostración, staff, casos y reportes de ejemplo
npm run kb:seed             # ingesta los documentos de knowledge/
npm run dev                 # Vite en http://localhost:5173 + Express en :3000 (proxy de /api)
```

### Variables de entorno

| Variable | Dónde se obtiene |
| --- | --- |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (secreta, solo backend) |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` |
| `AI_PROVIDER` | `openrouter` (predeterminado), `openai` o `gemini` |
| `OPENROUTER_API_KEY` | openrouter.ai → Keys (requiere créditos) |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `OPENROUTER_EMBEDDING_MODEL` | `openai/text-embedding-3-small` |
| `OPENROUTER_CHAT_MODEL` | `openai/gpt-5.4-mini` |
| `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL`, `OPENAI_CHAT_MODEL` | Alternativa: platform.openai.com (la suscripción de ChatGPT no incluye la API) |
| `GEMINI_API_KEY`, `GEMINI_EMBEDDING_MODEL`, `GEMINI_CHAT_MODEL` | Alternativa: Google AI Studio |
| `AI_REASONING_EFFORT`, `AI_MIN_SIMILARITY`, `APP_URL` | Opcionales (ver `.env.example`) |
| `PORT` | Solo local, por defecto `3000` |

Solo son obligatorias las variables del proveedor activo. **Si cambias `AI_PROVIDER` o el modelo de embeddings, ejecuta `npm run kb:seed`:** los embeddings no son compatibles entre proveedores.

## Despliegue en Vercel (pasos exactos)

Todo se ejecuta desde la raíz del repositorio, en tu máquina.

1. **Base de datos (Supabase):**
   ```bash
   npx supabase login
   npx supabase link --project-ref <REF_DEL_PROYECTO>
   npx supabase db push
   ```
2. **Seed de usuarios y datos de demostración** (usa el `.env` local con las claves del mismo proyecto):
   ```bash
   npm run seed
   ```
3. **Base de conocimiento del asistente:**
   ```bash
   npm run kb:seed
   ```
4. **Proyecto y variables de entorno en Vercel:**
   ```bash
   npx vercel login
   npx vercel link
   npx vercel env add SUPABASE_URL production
   npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
   npx vercel env add SUPABASE_ANON_KEY production
   npx vercel env add AI_PROVIDER production
   npx vercel env add OPENROUTER_API_KEY production
   npx vercel env add OPENROUTER_BASE_URL production
   npx vercel env add OPENROUTER_EMBEDDING_MODEL production
   npx vercel env add OPENROUTER_CHAT_MODEL production
   ```
   Cada comando pide el valor. También puedes cargarlas en Vercel → Project → Settings → Environment Variables.
5. **Desplegar:**
   ```bash
   npx vercel deploy --prod
   ```
6. **Comprobar:** abre `https://<tu-proyecto>.vercel.app/api/health` (debe responder `{"status":"ok"}`), recarga `/informate` y `/admin/casos` (no debe dar 404) e inicia sesión con una cuenta de demostración.

La configuración está en [vercel.json](vercel.json): preset Vite, `maxDuration` de 300 s para la función y rewrites de `/api/*` a Express y del resto a `index.html`. Las subidas a la base de conocimiento tienen un máximo de 4 MB (el límite de Vercel es 4,5 MB).

## Cuentas de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Coordinadora (Carmen Flores) | `coordinadora@rimay.pe` | `rimay2026` |
| Gestora (Lucía Ramos) | `gestora@rimay.pe` | `rimay2026` |

Todos los datos de demostración son ficticios.

## Guion de la demo (2 a 3 minutos)

1. María entra a Rimay desde su celular. Paso 1: marca «Sí» en peligro inmediato y ve el 105.
2. Continúa, desactiva el anonimato, elige «Mensaje de texto», de 9 a 11 a. m., y envía.
3. Pregunta al asistente «¿Necesito un abogado para denunciar?» y recibe una respuesta con fuente.
4. Se cambia a `/admin/login` como gestora: el caso de María aparece primero, marcado con riesgo.
5. La gestora muestra el contacto (queda registrado), lo marca como contactado y lo deriva al CEM; el dashboard se actualiza.
6. Cierre: «Salir rápido» y el selector de quechua y aimara.
