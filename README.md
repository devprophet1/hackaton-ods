# Rimay

**Página demo:** https://hackaton-ods.vercel.app · **Panel:** https://hackaton-ods.vercel.app/admin (cuenta `admin@rimay.pe` / `rimay2026`)

**Equipo:** MJM Group · **Integrantes:** Carlos Javier Majerhua Nuñez, Jhair Nina Meza y Marcos Lazo Rodriguez

Rimay («hablar» en quechua) es una plataforma web para el desafío **Prevención de violencia (ODS 5: igualdad de género)** del HackODS UA 2026. Permite reportar casos de violencia en Villa El Salvador de forma segura, recibir orientación inmediata de un asistente con RAG y, si la persona lo pide, ser contactada por una institución aliada que hace el seguimiento desde un panel `/admin`.

## Qué incluye

- **Web pública:** inicio, «Cómo funciona», «Infórmate», reporte en 3 pasos, preguntas frecuentes, «Nosotros», asistente flotante y selector de idioma (español, quechua y aimara; traducciones preliminares).
- **Seguridad de la víctima:** botón «Salir rápido» siempre visible (también con Esc tres veces), anónimo por defecto, ningún campo obligatorio (la dirección también es opcional y queda oculta en el panel hasta «Mostrar»), nunca se pide DNI y nada del reporte se guarda en el navegador.
- **Canales de emergencia con tooltip:** 105 (Policía Nacional del Perú), Línea 100 y Chat 100 (Ministerio de la Mujer), 106 (SAMU) y 113 opción 5 (salud mental del Minsa) indican a qué entidad pertenecen.
- **Asistente con RAG:** responde con documentos oficiales (OpenRouter + pgvector) y detecta frases de riesgo antes de llamar al modelo.
- **Panel `/admin`:** bandeja de casos con riesgo primero, contacto enmascarado con acceso registrado, seguimiento (Pendiente, Contactado, Derivado a CEM / Policía / otra entidad, Cerrado) con quién contacta a la persona, análisis de apoyo con IA para decidir el siguiente paso, notas, dashboard y base de conocimiento.

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

Con `npm run dev` en marcha, en otra terminal:

```bash
npm run smoke               # prueba de humo del flujo feliz contra http://localhost:5173 (borra lo que crea)
```

Abre http://localhost:5173 para la web pública y http://localhost:5173/admin para el panel.

### Variables de entorno

| Variable | Dónde se obtiene |
| --- | --- |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (secreta, solo backend) |
| `SUPABASE_ANON_KEY` | Opcional. Supabase → Project Settings → API → `anon` (si falta, el login usa la clave secreta desde el backend) |
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

## Flujo de trabajo: directo en `main`

Se trabaja directo en `main`, sin ramas. **Cada push a `main` se despliega automáticamente en producción** (https://hackaton-ods.vercel.app), así que antes de cada push:

```bash
npm run dev                  # en una terminal
npm run smoke                # en otra: debe terminar con «✓ Flujo feliz completo.»
git push origin main         # solo si la prueba de humo pasó
```

Cuando Vercel termine de desplegar, comprueba producción:

```bash
npm run smoke -- https://hackaton-ods.vercel.app
```

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
6. **Comprobar:** abre `https://<tu-proyecto>.vercel.app/api/health` (debe responder `{"status":"ok"}`), recarga `/informate` y `/admin/casos` (no debe dar 404) e inicia sesión con una cuenta de demostración. También puedes ejecutar la prueba de humo contra producción:
   ```bash
   npm run smoke -- https://<tu-proyecto>.vercel.app
   ```

La configuración está en [vercel.json](vercel.json): preset Vite, región `pdx1`, `maxDuration` de 300 s para la función y rewrites de `/api/*` a Express y del resto a `index.html`. Las subidas a la base de conocimiento tienen un máximo de 4 MB (el límite de Vercel es 4,5 MB).

## Privacidad (demo y producción)

La demo usa **solo datos ficticios**. El análisis de apoyo con IA del panel no envía el alias, el teléfono ni la dirección: solo el relato y datos del caso. Es orientativo y no se guarda. Antes de usar Rimay con datos reales falta: ocultar teléfonos, DNI, correos y direcciones dentro del relato antes de enviarlo al modelo, usar proveedores de IA que no guarden la información y avisarlo en el panel (ver la sección 15 del spec).

## Cuenta de demostración

Una sola cuenta con acceso al panel `/admin` y un solo rol (`admin`, que hace todo: seguimiento de estado y derivación, notas, mostrar contacto, análisis de apoyo, dashboard y base de conocimiento):

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administradora (Administradora Rimay) | `admin@rimay.pe` | `rimay2026` |

Lucía Ramos y Sofía Huamán siguen en la tabla `staff` con la cuenta bloqueada (no entran al panel).

Todos los datos de demostración son ficticios.

## Guion de la demo (2 a 3 minutos)

1. María entra a Rimay desde su celular. Paso 1: marca «Sí» en peligro inmediato y ve el 105.
2. Continúa, desactiva el anonimato, elige «Mensaje de texto», de 9 a 11 a. m., y envía.
3. Pregunta al asistente «¿Necesito un abogado para denunciar?» y recibe una respuesta con fuente.
4. Se cambia a `/admin/login` como administradora (`admin@rimay.pe`): el caso de María aparece primero, marcado con riesgo.
5. La administradora muestra el contacto (queda registrado), genera el análisis de apoyo, lo pasa a Contactado indicando quién la contacta y luego lo deriva al CEM; el historial y el dashboard se actualizan.
6. Cierre: «Salir rápido» y el selector de quechua y aimara.
