# Rimay — Especificación de implementación

Versión: 23 de noviembre de 2026. Esta especificación reemplaza a las versiones anteriores.

Rimay («hablar» en quechua) es una plataforma web para el desafío **Prevención de violencia (ODS 5)** del HackODS UA 2026. Permite reportar casos de violencia en Villa El Salvador de forma segura, recibir orientación inmediata de un asistente con RAG y, si la persona lo pide, ser contactada por una institución aliada que hace el seguimiento desde un panel `/admin`.

Las maquetas en `specs/maquetas/` son la referencia visual y de comportamiento. El frontend final debe verse y funcionar igual, pero conectado al backend.

---

## 1. Principios no negociables

1. **Seguridad de la víctima primero.** Botón «Salir rápido» visible en toda la web pública; ningún dato pedido es obligatorio; anónimo por defecto; nunca se pide DNI.
2. **Identidad separada del relato.** Los datos de contacto viven en una tabla aparte y solo existen si la persona desactiva el modo anónimo.
3. **El asistente nunca recibe datos personales.** Solo el texto de la pregunta. No se guardan conversaciones.
4. **Derivar siempre a canales oficiales.** El asistente orienta, no diagnostica ni califica el riesgo.
5. **No inventar datos oficiales.** Solo se usan los datos verificados de la sección 12. Si falta un número o dirección, se deja «Consulta el canal oficial».
6. **Hackatón:** priorizar que la demo funcione de punta a punta. Seguridad razonable, sin sobreingeniería.

---

## 2. Alcance

**Incluye**
- Web pública: inicio, «Cómo funciona», «Infórmate», reporte en 3 pasos, confirmación, preguntas frecuentes, «Nosotros», asistente flotante, selector de idioma (español, quechua, aimara).
- Backend Express con módulos `reports`, `rag`, `auth`, `cases`, `stats` y `kb`.
- Panel `/admin` con login, bandeja de casos, dashboard y base de conocimiento.
- Despliegue en Vercel como una sola app (frontend estático + Express como función bajo `/api`). Ver sección 16.
- Base de datos Supabase (Postgres + pgvector + Auth).

**Fuera de alcance hoy**
- Notificaciones por correo o SMS (no deben existir: exponen a la víctima).
- Traducción completa validada a quechua y aimara (se integra cuando llegue; ver sección 8).
- Gestión de usuarios desde el panel (los usuarios se crean con un script de seed).
- Integración con sistemas del Estado.

---

## 3. Stack

| Capa | Tecnología | Notas |
| --- | --- | --- |
| Frontend público | Vue 3 + Vite, Composition API (`<script setup>`), JavaScript (sin TypeScript) | Vue Router. Sin librerías de UI: CSS propio con los tokens de la maqueta |
| Frontend admin | La misma app Vue, rutas `/admin/*` con lazy loading | Quien visita la web pública no descarga el código del panel |
| Estado e idiomas | Composables (`useAuth`, `useI18n`, …) | Sin Pinia ni vue-i18n |
| Backend | Node.js + Express 5, JavaScript con ES modules, monolito modular | Cada módulo en su carpeta (rutas + servicio); ninguno importa servicios internos de otro |
| Base de datos | Supabase: Postgres + pgvector | Migraciones con Supabase CLI desde la máquina del equipo |
| Autenticación | Supabase Auth (correo y contraseña) | Solo para el personal del panel |
| IA | Módulo común `server/common/ai.js` con `embed(texts, kind)` y `chat(systemPrompt, userMessage)`. Proveedor según `AI_PROVIDER`: **OpenRouter** (predeterminado; SDK oficial `openai` con `baseURL` de OpenRouter y encabezados `HTTP-Referer` y `X-Title: Rimay`), **OpenAI** directo o **Gemini** (REST) como alternativas | Verificado el 23/11/2026 en `GET https://openrouter.ai/api/v1/models`: existen `openai/gpt-5.4-mini` (chat) y `openai/text-embedding-3-small` (embeddings). Embeddings con `dimensions: 768`. `gpt-5.4-mini` es de razonamiento: se envía `reasoning.effort = "none"` (el más bajo), salida máxima de 300 tokens y sin `temperature` (no la acepta). Gemini: `gemini-embedding-001` (768 dim., normalizado) y `gemini-3.6-flash`. **Los embeddings no son compatibles entre proveedores: al cambiar `AI_PROVIDER` hay que ejecutar `npm run kb:seed`** |
| Despliegue | Vercel (un proyecto, un dominio) | Vite genera estáticos; Express corre como Vercel Function en `api/index.js` |

Un solo repositorio y un solo `package.json`. El frontend **nunca** habla directo con Supabase. Todo pasa por el backend, que usa la `service_role key`. El frontend llama siempre a rutas relativas (`/api/...`): mismo dominio, sin CORS.

---

## 4. Estructura del repositorio

```
rimay/
├── CLAUDE.md
├── README.md                      ← obligatorio por las bases (ver sección 11)
├── package.json                   ← único: frontend, backend y scripts
├── index.html                     ← entrada de Vite (título «Consultas», favicon neutro)
├── vite.config.js                 ← plugin Vue + proxy /api → Express en desarrollo
├── vercel.json                    ← ver sección 16
├── server.js                      ← arranque local de Express (app.listen)
├── api/
│   └── index.js                   ← Vercel Function: export default de server/app.js
├── specs/
│   ├── rimay-mvp.md
│   └── maquetas/
│       ├── index.html             ← maqueta web pública
│       └── admin.html             ← maqueta panel /admin
├── public/                        ← estáticos servidos tal cual
│   ├── textos.json                ← diccionario es / qu / ay
│   └── favicon.svg                ← círculo amarillo
├── src/                           ← frontend Vue
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js            ← rutas públicas + /admin/* lazy + guard
│   ├── layouts/
│   │   ├── PublicLayout.vue       ← franja, cabecera, aviso, menú, Salir rápido, asistente
│   │   └── AdminLayout.vue        ← importa admin.css (queda en el chunk del panel)
│   ├── views/public/              ← HomeView, HowView, LearnView, ReportView, FaqView, AboutView
│   ├── views/admin/               ← LoginView, CasesView, DashboardView, KnowledgeView
│   ├── components/                ← EmergencyStrip, SiteHeader, SideMenu, QuickExitButton,
│   │                                 ExitNotice, AssistantWidget, AppCard, AppAlert, …
│   ├── composables/               ← useI18n, useAuth, useQuickExit, useApi, usePrefs
│   └── assets/                    ← tokens.css, public.css, admin.css
├── server/                        ← backend Express
│   ├── app.js                     ← crea la app, monta /api/<módulo>, manejo de errores
│   ├── common/                    ← config, cliente Supabase, guard de auth, proveedor de IA (`ai.js` + `gemini.js`), errores
│   └── modules/
│       ├── reports/               ← reports.routes.js + reports.service.js
│       ├── rag/
│       ├── auth/                  ← incluye GET /staff
│       ├── cases/
│       ├── stats/
│       └── kb/                    ← incluye la ingesta (chunking + embeddings)
├── scripts/
│   ├── seed.js                    ← usuarios de Auth, staff, casos demo y reportes anónimos
│   └── kb-seed.js                 ← ingesta knowledge/ usando el servicio de kb
├── supabase/
│   └── migrations/
└── knowledge/                     ← documentos fuente del RAG (.md)
```

Reglas del monolito modular: un módulo solo expone su `router`; los servicios de un módulo no se importan desde otro. Lo compartido (Supabase, proveedor de IA, guard, errores) vive en `server/common/`.

---

## 5. Modelo de datos (migraciones)

Crear en este orden en `supabase/migrations/`.

```sql
-- 0001_extensions.sql
create extension if not exists vector;
create extension if not exists pgcrypto;
```

```sql
-- 0002_staff.sql
create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('coordinadora','gestora','admin')),
  institution text default 'CEM Villa El Salvador (demo)',
  created_at timestamptz default now()
);
```

```sql
-- 0003_reports.sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                     -- 'RI-' + 6 dígitos
  is_anonymous boolean not null default true,
  device_safe text check (device_safe in ('si','no','no_seguro')),
  danger text check (danger in ('si','no','no_se')),
  has_risk boolean not null default false,       -- true si danger = 'si'
  violence_types text[] default '{}',            -- fisica, psicologica, sexual, economica, no_se
  place text,
  description text,
  support_types text[] default '{}',             -- psico, legal, medico, info
  status text not null default 'pendiente'
    check (status in ('pendiente','contactado','derivado_cem','derivado_comisaria','cerrado')),
  derived_to text check (derived_to in ('cem','comisaria')), -- se conserva aunque luego se cierre (dashboard «Derivaciones»)
  assigned_to uuid references staff(id),
  first_contact_at timestamptz,
  created_at timestamptz default now()
);
create index reports_status_idx on reports(status);
```

```sql
-- 0004_persons.sql
-- Solo existe si la persona desactivó el modo anónimo
create table persons (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references reports(id) on delete cascade,
  alias text,
  contact_method text check (contact_method in ('sms','whatsapp','llamada')),
  contact_value text,
  safe_schedule text,
  created_at timestamptz default now()
);
```

```sql
-- 0005_case_events.sql
create table case_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  actor_id uuid references staff(id),           -- null = sistema
  event_type text not null check (event_type in ('creado','asignado','estado','nota','acceso_contacto')),
  detail text,
  created_at timestamptz default now()
);
create index case_events_report_idx on case_events(report_id);
```

```sql
-- 0006_consents.sql
create table consents (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  purpose text not null,          -- 'registro_reporte' | 'contacto'
  granted boolean not null,
  created_at timestamptz default now()
);
```

```sql
-- 0007_knowledge_base.sql
create table kb_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  status text not null default 'procesando' check (status in ('procesando','procesado','error')),
  chunk_count int default 0,
  uploaded_by uuid references staff(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references kb_documents(id) on delete cascade,
  content text not null,
  embedding vector(768),
  created_at timestamptz default now()
);

create or replace function match_chunks(query_embedding vector(768), match_count int default 5, min_similarity float default 0.5)
returns table (id uuid, content text, document_title text, source text, similarity float)
language sql stable as $$
  select c.id, c.content, d.title, d.source, 1 - (c.embedding <=> query_embedding) as similarity
  from kb_chunks c join kb_documents d on d.id = c.document_id
  where d.status = 'procesado' and 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
```

```sql
-- 0008_anonymous_stats_view.sql
create view violence_type_counts as
select t as violence_type, count(*) as total
from reports, unnest(violence_types) as t
group by t;
```

**Seed (`npm run seed` → `scripts/seed.js`, idempotente, usa la `service_role key`):**
- Se hace en Node y no en `seed.sql` porque los casos dependen de los usuarios de Auth y `supabase db push` no ejecuta el seed en el proyecto remoto.
- Crear dos usuarios en Supabase Auth: `coordinadora@rimay.pe` (Carmen Flores, coordinadora) y `gestora@rimay.pe` (Lucía Ramos, gestora), contraseña `rimay2026`, y sus filas en `staff`. Añadir una tercera gestora sin login: Sofía Huamán.
- Insertar los 5 casos de demostración de la maqueta del admin (Rosa, Ana, Flor, M., K.) con sus eventos, y unos 20 reportes anónimos distribuidos por tipo para el dashboard.
- Todos los datos de seed son ficticios.

---

## 6. API del backend

Base: `/api`. Respuestas en JSON. Errores con `{ "message": "…" }` en español.

### Públicos (sin login)

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servicio |
| POST | `/reports` | Crea un reporte |
| POST | `/rag/chat` | Pregunta al asistente |

`POST /reports`
```json
{
  "isAnonymous": false,
  "deviceSafe": "si",
  "danger": "si",
  "violenceTypes": ["psicologica", "fisica"],
  "place": "Vivienda",
  "description": "",
  "supportTypes": ["legal", "psico"],
  "contact": { "alias": "Rosa", "method": "sms", "value": "987654821", "safeSchedule": "Lunes a viernes, 9 a 11 a. m." }
}
```
- `contact` se ignora si `isAnonymous` es `true`.
- `has_risk = danger === 'si'`.
- Crea el reporte, la fila de `persons` si aplica, el evento `creado` y los consentimientos (`registro_reporte` siempre; `contacto` si no es anónimo).
- Respuesta: `{ "code": "RI-482193", "isAnonymous": false }`.
- No registrar el cuerpo de la petición en logs.

`POST /rag/chat`
```json
{ "message": "¿Necesito un abogado para denunciar?" }
```
Respuesta:
```json
{ "answer": "…", "sources": [{ "title": "Cómo presentar una denuncia", "source": "Guía Rimay" }], "risk": false }
```
Ver sección 9 para la lógica.

### Panel (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` → `{ token, user: { id, fullName, role } }` (Supabase `signInWithPassword`) |
| GET | `/auth/me` | Usuario actual |
| GET | `/staff` | Lista de personal para asignar |
| GET | `/cases?filter=all\|risk\|pending\|mine\|unassigned\|closed` | Bandeja. Solo reportes **no anónimos**. Orden: riesgo activo primero, luego por estado, luego más reciente. El contacto viene **enmascarado** (`••• ••• 821`) |
| GET | `/cases/:id` | Detalle con eventos (contacto enmascarado) |
| POST | `/cases/:id/contact-access` | Devuelve el contacto completo y registra evento `acceso_contacto` |
| PATCH | `/cases/:id/assign` | `{ staffId \| null }` → evento `asignado` |
| PATCH | `/cases/:id/status` | `{ status }` → evento `estado`; si pasa de `pendiente` a otro estado y `first_contact_at` es null, se completa |
| POST | `/cases/:id/notes` | `{ text }` → evento `nota` |
| GET | `/stats/dashboard` | `{ activeCases, activeRisk, avgHoursToFirstContact, derived, byStatus, byViolenceType, last7Days, derivations: { cem, comisaria }, overdueRisk }` |
| GET | `/kb/documents` | Lista de documentos |
| POST | `/kb/documents` | Multipart (campo `file`), archivo `.md` o `.txt`, **máximo 4 MB** (límite de cuerpo de Vercel: 4,5 MB). Simplificación para la demo: la ingesta se hace completa dentro de la misma petición (cabe en los 300 s de `maxDuration`) y responde `201` con el documento `procesado`; mientras tanto el panel muestra «Procesando…». PDF queda fuera (TODO) |
| POST | `/kb/search` | `{ query }` → top 3 fragmentos con similitud (para «Probar búsqueda») |

`overdueRisk` = casos con `has_risk`, estado `pendiente` y más de 1 hora desde `created_at`.

`GET /cases` devuelve `{ cases, summary: { overdueRisk: [ids], riskPending } }` para la alerta y el contador del menú.

Guard de auth (middleware Express en `server/common/`): validar el token con `supabase.auth.getUser(token)` y cargar la fila de `staff`. Sin token o token inválido → 401. Si no existe en `staff` → 403.

Errores: un manejador central responde `{ message }` en español y registra solo el mensaje del error, nunca el cuerpo de la petición. No se usa ningún logger de peticiones que imprima cuerpos.

---

## 7. Frontend público (Vue)

Replicar `specs/maquetas/index.html` como app Vue 3. Cada vista de la maqueta pasa a ser una ruta:

| Ruta | Vista de la maqueta |
| --- | --- |
| `/` | Inicio |
| `/como-funciona` | Cómo funciona |
| `/informate` | Infórmate (las anclas `#senales`, `#tipos`, … siguen funcionando) |
| `/reportar` | Reporte en 3 pasos y confirmación (la confirmación es un estado de la vista, no una ruta) |
| `/preguntas` | Preguntas frecuentes |
| `/nosotros` | Nosotros |

Cualquier otra ruta pública redirige a `/`. El CSS de la maqueta se reutiliza tal cual en `src/assets/` (tokens, botones, modo oscuro).

**Cambio respecto a la maqueta:** eliminar la vista «Panel del aliado» de la web pública. El enlace «Acceso para aliados» del pie y «Ingresar al panel» del menú llevan a `/admin/login`.

**Texto seguro:** todo texto de usuario o de la API se muestra con interpolación `{{ }}`. Prohibido `v-html`.

### Elementos globales
- Franja superior: «¿Estás en peligro ahora?» + `tel:105`, `tel:100` y enlace al Chat 100 (`https://chat100.warminan.gob.pe`, `target="_blank" rel="noopener"`).
- Cabecera: logo, navegación (Inicio, Cómo funciona, Infórmate, Reportar, Preguntas), botón «Menú» y botón «Salir rápido».
- Aviso amarillo bajo la cabecera explicando «Salir rápido», con botón «Entendido».
- Menú lateral: secciones, accesibilidad (tamaño de texto Normal/Grande; idioma Español/Quechua/Aimara) y enlace a `/admin/`.
- Título de la pestaña neutro: «Consultas». Favicon neutro (círculo amarillo).

### Salir rápido
- Botón visible en todas las rutas públicas (componente del `PublicLayout`) y atajo **Esc tres veces en menos de 1,2 s** (composable `useQuickExit`, registrado en el layout público).
- Oculta el contenido al instante (`body.style.visibility = 'hidden'`) y ejecuta `location.replace('https://www.google.com/')` (intentar `window.top` primero).
- No mostrar ninguna pantalla intermedia.

### Reporte en 3 pasos
Barra de progreso: «1. Tu seguridad», «2. Lo que pasó», «3. Apoyo». Mensaje: «Puedes salir en cualquier momento. Nada se guarda hasta que pulses «Enviar reporte».»

Paso 1, reglas de los avisos:

| Pregunta | Respuesta | Aviso |
| --- | --- | --- |
| ¿Es seguro usar este dispositivo ahora? | No / No estoy seguro/a | Amarillo: usar Línea 100 o Chat 100 desde otro teléfono o computadora; botón «Salir ahora» |
| ¿Existe peligro inmediato? | Sí | Rojo: botones `tel:105` y `tel:100` |
| ¿Existe peligro inmediato? | No sé | Amarillo: Línea 100 puede evaluar la situación; botones llamar al 100, Chat 100 y asistente |

Ningún aviso bloquea continuar.

Paso 2: switch «Enviar de forma anónima» (activado por defecto). Si se desactiva, mostrar alias, medio seguro (Mensaje de texto / WhatsApp / Llamada), número y horario seguro. Tipos de violencia (multiselección, Ley N.º 30364), lugar, descripción opcional.

Paso 3: tipo de apoyo (Psicológico, Legal, Médico, Información general). «Enviar reporte» llama a `POST /api/reports`.

Confirmación: código devuelto y próximos pasos según el apoyo elegido. Si no es anónimo, primero «Te contactaremos…» con el medio elegido. Si falla la red: mensaje claro con la Línea 100 y opción de reintentar. Nunca perder lo escrito: el borrador vive solo en memoria (estado reactivo del módulo, sobrevive a cambiar de ruta dentro de la app), **nunca** en `localStorage` ni `sessionStorage`, y se borra al enviar con éxito.

### Asistente flotante
- Botón «¿Necesitas orientación?» y panel de chat. Preguntas sugeridas: «¿Dónde pido ayuda?», «¿Qué dice la ley?», «¿Cómo denuncio?», «¿Cómo ayudo a alguien?».
- Llama a `POST /api/rag/chat`. Indicador «escribiendo». Muestra la fuente bajo cada respuesta.
- Si `risk: true`, mostrar la tarjeta roja con `tel:105` y `tel:100`.
- `aria-live="polite"` en la lista de mensajes. Texto siempre con interpolación `{{ }}`, nunca `v-html`.

### Contenido informativo
Copiar tal cual de la maqueta: «Cómo funciona», «Infórmate» (señales, tipos de violencia, derechos, plan de seguridad, cómo ayudar, directorio), preguntas frecuentes y «Nosotros» (con glosario quechua y aimara).

### Diseño
Tokens de la maqueta: blanco `#FFFFFF`, amarillo `#FFD95A`, carbón `#2F2F2F`, Lora para títulos y Nunito Sans para texto, botones con esquinas asimétricas (`4px 22px 4px 22px`), modo oscuro con `prefers-color-scheme`. Responsive hasta 360 px. Objetivos táctiles de 44 px o más.

---

## 8. Idiomas (i18n)

- `public/textos.json` contiene un arreglo `{ id, contexto, es, qu, ay }` con todos los textos (`qu` y `ay` pueden venir vacíos). Si el equipo no entrega el archivo, se genera a partir de la maqueta con `es` completo y `qu`/`ay` vacíos.
- El composable `useI18n` carga `textos.json` una vez y expone `lang` (reactivo), `setLang(lang)` y `t(id)`. Si una traducción está vacía, usa el español; si el id no existe, devuelve el id (para detectarlo en desarrollo).
- Las plantillas usan `{{ t('id') }}` y `:placeholder="t('id')"`. Los textos generados por código (confirmación, próximos pasos, respuestas fijas) también usan `t(id)`.
- El idioma elegido se guarda en `localStorage` solo como preferencia de interfaz.
- Al elegir quechua o aimara se muestra el aviso «La Línea 100 te atiende en [idioma], gratis y las 24 horas» con `tel:100`.
- Las respuestas del asistente siguen en español en el MVP.
- Las traducciones deben marcarse como preliminares hasta que las valide un hablante nativo.

---

## 9. Asistente con RAG

### Ingesta (`kb` y `npm run kb:seed`)
1. Leer el archivo (`.md`/`.txt`; PDF fuera de alcance por simplicidad).
2. Dividir en fragmentos de unos 800 caracteres con solapamiento de 100, respetando párrafos.
3. Generar embeddings con `embed(fragmentos, 'document')` del módulo común (768 dimensiones, lotes de hasta 100). Con Gemini se usa `taskType: RETRIEVAL_DOCUMENT` y el vector se normaliza.
4. Guardar en `kb_chunks`, actualizar `chunk_count` y `status = 'procesado'` (o `'error'`).
5. `npm run kb:seed` ingesta todos los archivos de `knowledge/` desde la máquina del equipo (sin límite de tiempo de Vercel). Es idempotente: reemplaza los documentos con el mismo `title`.
6. En Vercel, la subida desde el panel se procesa dentro de la misma petición, sin trabajo en segundo plano, dentro del `maxDuration` de 300 s. Con el límite de 4 MB por archivo alcanza.

### Consulta (`POST /rag/chat`)
1. **Detección de riesgo antes del modelo.** Si el mensaje contiene alguna de estas expresiones (sin tildes, en minúsculas): `matar`, `me mata`, `me va a`, `miedo`, `peligro`, `golpea`, `golpe`, `arma`, `cuchillo`, `ahora mismo`, `amenaz`, responder de inmediato con `risk: true` y el texto fijo: «Lo que cuentas es serio y tu seguridad es lo primero. Si estás en peligro ahora, llama al 105 o a la Línea 100.» No llamar al modelo.
2. Generar el embedding de la pregunta con `embed([pregunta], 'query')` (768 dimensiones).
3. `match_chunks(embedding, 5, umbral)`. El umbral depende del modelo de embeddings: 0,3 con `text-embedding-3-small` (OpenRouter/OpenAI; las preguntas fuera de tema quedan ≤ 0,28) y 0,5 con Gemini. Se puede ajustar con `AI_MIN_SIMILARITY`.
4. Si no hay fragmentos, responder sin modelo: orientar a la Línea 100 y al Chat 100.
5. Llamar a `chat(prompt del sistema, contexto + pregunta)`. Máximo unas 120 palabras de respuesta, en texto plano (el backend quita marcas de Markdown porque el widget muestra texto con `{{ }}`).
6. Devolver `answer`, `sources` (títulos únicos de los documentos cuyos fragmentos superaron el umbral) y `risk: false`.
7. No guardar mensajes. No registrar el texto de la pregunta en logs.

**Cambio de proveedor de IA.** Los vectores de un proveedor no sirven con otro (distinto espacio de embeddings). Después de cambiar `AI_PROVIDER` o el modelo de embeddings, ejecutar `npm run check` y luego `npm run kb:seed` para regenerar `kb_chunks`.

### Prompt del sistema

```text
Eres el asistente de orientación de Rimay, una plataforma de apoyo frente a la violencia en Villa El Salvador, Lima, Perú.

Reglas:
1. Cada afirmación de tu respuesta debe salir del CONTEXTO. Si el CONTEXTO no lo dice, no lo agregues: no completes con conocimiento general, consejos propios ni detalles prácticos (con quién ir, qué llevar, horarios, plazos, costos) que no estén escritos ahí. Si no hay información suficiente, dilo y recomienda la Línea 100. La única excepción son los canales fijos de derivación de la regla 4 (105, Línea 100, Chat 100 y Centro de Emergencia Mujer), que siempre puedes mencionar.
2. Usa los tipos de violencia de la Ley N.º 30364 (física, psicológica, sexual, económica o patrimonial) solo para explicar; nunca diagnostiques ni califiques el riesgo.
3. Apoyo psicológico de primera respuesta: escucha sin juzgar, valida lo que siente la persona, pregunta qué necesita, ayúdala a pensar en su seguridad y facilita el contacto con apoyo humano. Nunca ofrezcas terapia ni evaluación clínica.
4. Deriva siempre a canales oficiales:
   - Línea 100 (MIMP): gratuita, confidencial, 24 horas, en español, quechua y aimara.
   - Chat 100: https://chat100.warminan.gob.pe
   - Centro de Emergencia Mujer más cercano.
   - Comisaría o Central Única de Denuncias para denunciar.
   - 105 (Policía) si hay riesgo inmediato; 106 (SAMU) para emergencias médicas.
5. Nunca pidas datos personales ni que la persona repita su relato.
6. Responde en español, con frases cortas, tono cálido y claro. Máximo 120 palabras.
7. Escribe en texto plano, sin Markdown: sin asteriscos, almohadillas ni negritas. Para listas usa guiones.
```

### Base de conocimiento inicial (`knowledge/`)
Archivos: `ley-30364.md`, `linea-100-chat-100.md`, `como-denunciar.md` (título «Cómo presentar una denuncia»), `plan-de-seguridad.md`, `como-ayudar.md`, `directorio.md`. Si el equipo no los entrega, se redactan a partir del contenido de la maqueta, usando solo los datos de la sección 12. La primera línea `# Título` del archivo es el `title` del documento.

---

## 10. Panel `/admin` (rutas Vue con lazy loading)

Replicar `specs/maquetas/admin.html` conectado a la API. Rutas: `/admin/login`, `/admin/casos`, `/admin/dashboard`, `/admin/conocimiento` (`/admin` redirige a `/admin/casos`). Todas se cargan con `() => import(...)` para que el código y el CSS del panel queden en chunks aparte. Un guard de Vue Router exige token en las rutas del panel (salvo login); si no hay token, o la API responde 401, se borra la sesión y se redirige a `/admin/login`. El panel no muestra «Salir rápido» (no es para víctimas).

- **Login:** correo y contraseña → `POST /api/auth/login`. El composable `useAuth` guarda el token y el usuario en `sessionStorage`. Mostrar las cuentas de demostración en la pantalla. «Cerrar sesión» borra la sesión.
- **Casos:** filtros (Todos, Con riesgo, Pendientes, Mis casos, Sin asignar, Cerrados); alerta roja de `overdueRisk` con «Ver ahora»; contador de riesgo en el menú; detalle con contacto enmascarado y botón «Mostrar» (`contact-access`), primer mensaje neutro sugerido (distinto si el medio es llamada), asignación, estado, notas e historial. Refrescar la bandeja cada 30 segundos.
- **Dashboard:** indicadores y gráficos de `GET /stats/dashboard`, con barras en CSS como en la maqueta.
- **Base de conocimiento:** tabla de documentos, subida de archivos con estado «Procesando…» que se actualiza consultando cada 3 segundos, y «Probar búsqueda» con `POST /kb/search`.

---

## 11. README (obligatorio por las bases)

Debe incluir: nombre del equipo e integrantes (dejar `[Nombre del equipo]` y `[Integrantes]` para completar), descripción de la solución, ODS 5, tecnologías, arquitectura, instrucciones de instalación (Supabase, variables de entorno, migraciones, `seed`, `kb:seed`, `npm run dev`), los pasos exactos de despliegue en Vercel (sección 16), cuentas de demostración y un guion corto de la demo.

Variables de entorno (`.env.example` en la raíz; en Vercel se cargan en el proyecto). Ninguna lleva prefijo `VITE_`: el frontend no necesita secretos.
```
PORT=3000                                  # solo local
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
AI_PROVIDER=openrouter                     # openrouter | openai | gemini
AI_REASONING_EFFORT=                       # opcional, por defecto none
AI_MIN_SIMILARITY=                         # opcional, por defecto 0.3 (0.5 con gemini)
APP_URL=                                   # opcional, HTTP-Referer para OpenRouter
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
OPENROUTER_CHAT_MODEL=openai/gpt-5.4-mini
OPENAI_API_KEY=                            # alternativa
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-5.4-mini
GEMINI_API_KEY=                            # alternativa
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_CHAT_MODEL=gemini-3.6-flash
```

Solo son obligatorias las variables del proveedor activo.

Comandos (`package.json` único):

| Comando | Qué hace |
| --- | --- |
| `npm run check` | Valida variables, embeddings (768 dim.), chat del proveedor activo y Supabase, sin mostrar claves |
| `npm run dev` | Levanta Vite (5173) y Express (3000) a la vez; Vite hace proxy de `/api` a Express |
| `npm run build` | `vite build` → `dist/` |
| `npm run preview` | Sirve `dist/` (usar junto con `npm run dev:api`) |
| `npm run seed` | Usuarios de demostración, `staff`, casos y reportes de ejemplo |
| `npm run kb:seed` | Ingesta `knowledge/` (repetir al cambiar de proveedor de IA) |
| `npm run kb:test -- "pregunta"` | Prueba la búsqueda de la base de conocimiento |
| `npx supabase link` / `npx supabase db push` | Aplica `supabase/migrations/` al proyecto remoto |

---

## 12. Datos oficiales verificados

Usar solo estos. No añadir números ni direcciones sin fuente.

- Línea 100 (MIMP): gratuita, confidencial, 24 horas, todos los días, en español, quechua y aimara. Número `100`.
- Chat 100: `https://chat100.warminan.gob.pe`.
- Policía Nacional: `105`. SAMU: `106`.
- Ley N.º 30364: reconoce violencia física, psicológica, sexual y económica o patrimonial.
- Central Única de Denuncias y Centro de Emergencia Mujer: sin número ni dirección confirmados; mostrar «Consulta el canal oficial» o «Consulta tu CEM».

---

## 13. Orden de implementación

Trabajar hito por hito. Al terminar cada uno, comprobar su criterio de «listo» y hacer commit.

| Hito | Contenido | Listo cuando |
| --- | --- | --- |
| 0 | Esqueleto: Vite + Vue + Express, `vercel.json`, `npm run dev` | `npm run dev` sirve la app y `GET /api/health` responde por el proxy; `npm run build` genera `dist/` |
| 1 | Migraciones, seed y usuarios de demostración | `supabase db push` + `npm run seed` crean todo y los usuarios pueden iniciar sesión |
| 2 | Frontend público en Vue, sin backend | Se ve y funciona igual que la maqueta en las 6 rutas, sin la vista de panel; recargar cualquier ruta funciona |
| 3 | `POST /reports` conectado al formulario | Un reporte con contacto aparece en `reports` y `persons`; uno anónimo solo en `reports` |
| 4 | Ingesta y `POST /rag/chat` conectado al asistente | «¿Necesito un abogado para denunciar?» responde citando «Cómo presentar una denuncia»; «tengo miedo, me va a golpear» devuelve la tarjeta de riesgo sin llamar al modelo |
| 5 | Auth y módulo `cases` conectados al panel | Login con las cuentas de demo; el reporte del hito 3 aparece en la bandeja con riesgo; asignar, cambiar estado y notas quedan en el historial |
| 6 | `stats` y `kb` conectados al panel | El dashboard cambia al marcar un caso como contactado; subir un `.md` lo deja «Procesado» y la búsqueda lo encuentra |
| 7 | i18n con `textos.json` | Cambiar a quechua o aimara cambia todos los textos que tengan traducción; los vacíos quedan en español |
| 8 | README y despliegue en Vercel | Demo accesible desde un celular en la URL de Vercel: `tel:` abre el teléfono, «Salir rápido» lleva a Google y recargar `/admin/casos` o `/informate` no da 404 |

---

## 14. Guion de demo (2 a 3 minutos)

1. María entra a Rimay desde su celular. Paso 1: marca «Sí» en peligro inmediato y ve el 105.
2. Continúa, desactiva el anonimato, elige «solo mensaje, de 9 a 11 a. m.» y envía.
3. Pregunta al asistente «¿Necesito un abogado para denunciar?» y recibe una respuesta con fuente.
4. Se cambia al panel `/admin/login` como gestora: el caso de María aparece primero, marcado con riesgo.
5. La gestora muestra el contacto (queda registrado), lo marca como contactado y lo deriva al CEM; el dashboard se actualiza.
6. Cierre: «Salir rápido» y el selector de quechua y aimara.

---

## 15. Pendientes del equipo (no los resuelve Claude Code)

- Nombre: ya existe un proyecto llamado RIMAY de la Universidad del Pacífico (2025, inclusión lingüística con IA). Evaluar «Rimay VES» o «Rimay Warmi».
- Validar traducciones con hablantes nativos.
- Completar el nombre del equipo e integrantes.
- Definir qué institución operaría el panel en producción (presentarlo como convenio a futuro).

---

## 16. Despliegue en Vercel

Verificado en la documentación de Vercel el 23/11/2026.

**Forma elegida:** proyecto con preset **Vite** + **una sola Vercel Function** en `api/index.js` que hace `export default app` de `server/app.js` (una app Express es un handler `(req, res)` válido para el runtime Node.js). Se descarta el modo «Express sin configuración» porque convierte todo el proyecto en una función Express y no convive con el build de Vite; `framework: "vite"` se fija en `vercel.json` para que la detección no dependa de que exista `server.js`.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/index.js": { "maxDuration": 300 }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- Los archivos estáticos de `dist/` se sirven antes que los rewrites; todo lo demás que no sea `/api/*` va a `index.html` para que Vue Router resuelva la ruta al recargar.
- Express monta los módulos bajo `/api/...` y conserva la ruta original de la petición.
- `express.static` no se usa en producción (Vercel lo ignora); en local tampoco hace falta porque Vite sirve el frontend.

**Límites de las funciones y cómo se respetan**

| Límite | Valor | Decisión |
| --- | --- | --- |
| Cuerpo de la petición | 4,5 MB (20 MiB solo en beta y plan Pro) | `multer` en memoria con límite de 4 MB; `express.json` con límite de 100 kB |
| Duración máxima | 300 s por defecto y máximo en Hobby (Fluid compute) | `maxDuration: 300`; las llamadas al proveedor de IA llevan timeout propio (60 s) |
| Trabajo tras responder | No garantizado (solo con `waitUntil`) | No se usa: la ingesta termina antes de responder; la carga inicial se hace con `npm run kb:seed` desde local |
| Tamaño del bundle | 250 MB | Sin dependencias pesadas; el frontend no entra en la función |
| Estado en memoria | No persiste entre invocaciones | Nada depende de memoria del proceso (sin colas ni caché local) |

**Supabase** va aparte: las migraciones y el seed se ejecutan desde la máquina del equipo con la Supabase CLI y los scripts de Node; Vercel solo necesita las variables de entorno de la sección 11.