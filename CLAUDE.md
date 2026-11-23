# Rimay — Instrucciones para Claude Code

Plataforma de prevención de violencia (ODS 5) para el HackODS UA 2026. Se presenta hoy: prioriza que la demo funcione de punta a punta.

## Antes de empezar
- Lee `specs/rimay-mvp.md` completo. Es la fuente de verdad.
- Las maquetas `specs/maquetas/index.html` y `specs/maquetas/admin.html` son la referencia visual y de comportamiento. El resultado debe verse y funcionar igual.
- Trabaja por hitos (sección 13 del spec). Al terminar cada uno, verifica su criterio de «listo» y haz commit con un mensaje en español.

## Reglas del proyecto
- Un solo repo y un solo `package.json`. Todo JavaScript con ES modules; sin TypeScript.
- Frontend: Vue 3 + Vite, Composition API con `<script setup>`, Vue Router. Sin librerías de UI: CSS propio con los tokens de la maqueta. Estado con composables (`useAuth`, `useI18n`…); sin Pinia ni vue-i18n.
- Las rutas `/admin/*` se cargan con lazy loading (`() => import(...)`) y están protegidas por un guard que verifica el token.
- Backend: Express 5 como monolito modular en `server/modules/` (`reports`, `rag`, `auth`, `cases`, `stats`, `kb`). Cada módulo tiene sus rutas y su servicio y solo exporta su router; un módulo no importa servicios de otro. Lo compartido va en `server/common/`.
- El frontend nunca llama a Supabase directamente; todo pasa por rutas relativas `/api/...` (mismo dominio, sin CORS).
- Todo texto visible está en español, con tildes y signos de apertura (¿ ¡), y comillas «».
- Texto de usuario o de la API siempre con interpolación `{{ }}`. Prohibido `v-html`.
- Despliegue en Vercel: preset Vite + función `api/index.js` que reutiliza `server/app.js` (sección 16 del spec). Respeta los límites: cuerpo ≤ 4 MB, `maxDuration` 300 s, trabajo tras responder solo con `waitUntil`.

## Seguridad de la víctima (no romper)
- «Salir rápido» siempre visible en la web pública; Esc tres veces (en menos de 1,2 s) también lo activa; usa `location.replace` a Google sin pantallas intermedias.
- Avisos del paso 1 del reporte según la tabla del spec; ninguno bloquea continuar.
- Ningún campo del reporte es obligatorio. Anónimo por defecto. Nunca pedir DNI.
- No registrar en logs el cuerpo de `/reports` ni el texto de `/rag/chat`. No guardar conversaciones.
- No guardar datos del reporte en `localStorage` ni `sessionStorage`. En `localStorage` solo la preferencia de idioma y tamaño de texto.
- No añadir notificaciones por correo ni SMS.
- No inventar números de teléfono, direcciones ni horarios oficiales: usa solo la sección 12 del spec.

## Flujo de trabajo con git
- Se trabaja directo en `main`, sin ramas.
- Cada push a `main` se despliega en producción (https://hackaton-ods.vercel.app). Antes de cada push, con `npm run dev` en marcha, corre `npm run smoke` en local y sube solo si pasa. Si falla, no hagas push: corrige primero.
- Después del despliegue, corre `npm run smoke -- https://hackaton-ods.vercel.app`.
- Commits en español, sin líneas `Co-Authored-By` (ya desactivado en `.claude/settings.json`).

## Comandos
- `npm run check` → valida variables, proveedor de IA y Supabase (sin mostrar claves).
- `npm run smoke [URL]` → prueba de humo del flujo feliz (local por defecto); borra lo que crea.
- `npm run dev` → Vite (5173) + Express (3000) a la vez, con proxy de `/api`.
- `npm run build` → `dist/`.
- `npx supabase link --project-ref <ref>` y `npx supabase db push` → migraciones en el proyecto remoto.
- `npm run seed` → cuentas de demostración en Supabase Auth, `staff` y datos de ejemplo.
- `npm run kb:seed` → ingesta los documentos de `knowledge/`.
- Despliegue: automático en Vercel con cada push a `main` (ver README).

## Si algo no está claro
Elige la opción más simple que mantenga la demo funcionando y deja una nota `TODO:` explicando la decisión.
