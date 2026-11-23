# Rimay

**Equipo:** [Nombre del equipo] · **Integrantes:** [Integrantes]

Rimay («hablar» en quechua) es una plataforma web para el desafío **Prevención de violencia (ODS 5: igualdad de género)** del HackODS UA 2026. Permite reportar casos de violencia en Villa El Salvador de forma segura, recibir orientación inmediata de un asistente con RAG y, si la persona lo pide, ser contactada por una institución aliada que hace el seguimiento desde un panel `/admin`.

## Qué incluye

- **Web pública:** inicio, «Cómo funciona», «Infórmate», reporte en 3 pasos, preguntas frecuentes, «Nosotros», asistente flotante y selector de idioma (español, quechua y aimara; traducciones preliminares).
- **Seguridad de la víctima:** botón «Salir rápido» siempre visible (también con Esc tres veces), anónimo por defecto, ningún campo obligatorio, nunca se pide DNI y nada del reporte se guarda en el navegador.
- **Asistente con RAG:** responde con documentos oficiales (Gemini + pgvector) y detecta frases de riesgo antes de llamar al modelo.
- **Panel `/admin`:** bandeja de casos con riesgo primero, contacto enmascarado con acceso registrado, asignación, estados, notas, dashboard y base de conocimiento.

## Tecnologías y arquitectura

| Capa | Tecnología |
| --- | --- |
| Frontend | Vue 3 + Vite + Vue Router (JavaScript, sin librerías de UI) |
| Backend | Node.js + Express 5, monolito modular (`reports`, `rag`, `auth`, `cases`, `stats`, `kb`) |
| Datos | Supabase: Postgres + pgvector + Auth |
| IA | Gemini API: `gemini-embedding-001` (768 dim.) y `gemini-3.6-flash` |
| Despliegue | Vercel: estáticos de Vite + Express como una función bajo `/api` |

```
Navegador ──► Vercel
              ├─ /*      → dist/ (Vue, rutas resueltas con index.html)
              └─ /api/*  → api/index.js → server/app.js (Express) ──► Supabase y Gemini
```

El frontend solo llama a rutas relativas `/api/...`; nunca habla directo con Supabase. La especificación completa está en [specs/rimay-mvp.md](specs/rimay-mvp.md).

## Instalación local

Requisitos: Node.js 22 o superior, un proyecto de Supabase y una clave de la API de Gemini.

```bash
npm install
cp .env.example .env        # completa las variables (ver abajo)
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
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` |
| `GEMINI_CHAT_MODEL` | `gemini-3.6-flash` |
| `PORT` | Solo local, por defecto `3000` |

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
   npx vercel env add GEMINI_API_KEY production
   npx vercel env add GEMINI_EMBEDDING_MODEL production
   npx vercel env add GEMINI_CHAT_MODEL production
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
