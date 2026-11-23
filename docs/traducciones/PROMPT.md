# Prompt para traducir los textos pendientes de Rimay

Cómo usarlo:

1. `npm run i18n:pendientes` genera `docs/traducciones/pendientes.json` (textos sin quechua o sin aimara).
2. Copia el prompt de abajo en ChatGPT y adjunta (o pega) `pendientes.json`. Si es muy largo, envíalo en partes de unos 40 registros.
3. Guarda la respuesta como `docs/traducciones/traducido.json` (un solo arreglo JSON).
4. `npm run i18n:importar -- docs/traducciones/traducido.json` rellena solo los campos vacíos y avisa si falta algún número o nombre propio.
5. Revisa el resultado en la web (selector de idioma) y, antes de darlo por bueno, valídalo con hablantes nativos: la web ya muestra «Traducción preliminar».

---

Actúa como lingüista y traductor especializado en **quechua sureño** (variantes chanka y collao, alfabeto oficial del MINEDU) y en **aimara peruano de Puno** (alfabeto oficial del MINEDU).

## Contexto

Rimay es una plataforma web de apoyo a personas que viven violencia en Villa El Salvador, Lima (HackODS UA 2026). Permite reportar casos de forma segura y anónima, recibir orientación psicológica inicial y orientación legal informativa, y llegar a la Línea 100, el Chat 100 y el Centro de Emergencia Mujer. Muchas personas usuarias tienen el quechua o el aimara como lengua materna.

## Tarea

Te adjunto un JSON. Cada objeto tiene esta estructura:

```json
{ "id": 2, "contexto": "Texto de la página", "es": "¿Estás en peligro ahora?", "qu": "", "ay": "" }
```

Completa **solo los campos `qu` y `ay` que estén vacíos**, traduciendo directamente desde `es`. Devuelve el JSON completo, con los mismos objetos, en el mismo orden y sin texto adicional fuera del JSON.

## Reglas

1. No modifiques `id`, `contexto` ni `es`. No cambies los `qu` o `ay` que ya tienen texto.
2. Traduce desde el español. No uses el quechua como fuente del aimara ni al revés.
3. Usa el alfabeto oficial de cada lengua (apóstrofos de las consonantes glotalizadas, aspiradas, etc.).
4. Tono cálido, respetuoso, sencillo y empático; trata de «tú»; evita tecnicismos innecesarios.
5. Mantén sin traducir: Línea 100, Línea 113, Chat 100, Rimay, Ley N.º 30364, Centro de Emergencia Mujer, Central Única de Denuncias, WhatsApp, Google, Esc, HackODS UA 2026, Villa El Salvador y chat100.warminan.gob.pe.
6. Conserva exactamente los números (105, 100, 106, 113, 24…) y los marcadores como `{medio}` o `[IDIOMA]`.
7. No inventes términos jurídicos, psicológicos ni médicos; si no hay equivalencia segura, usa una expresión descriptiva que conserve el significado.
8. **Si no tienes suficiente seguridad sobre una traducción, deja el campo vacío (`""`).** Es preferible a una traducción dudosa: la web muestra el español en ese caso.
9. No agregues información ni elimines advertencias de seguridad. No conviertas una recomendación en una obligación ni al revés.
10. Mensajes de emergencia y riesgo: máxima precisión. No confundas un servicio de orientación (Línea 100, CEM) con la Policía o un juzgado. No alteres lo que se dice sobre anonimato, privacidad o datos personales (por ejemplo, «nunca pedimos tu DNI»).
11. Evita frases que culpen, intimiden o generen confusión.
12. Mantén la terminología consistente entre registros y con las traducciones que ya existen en el archivo.
13. No afirmes haber verificado una traducción con fuentes que no consultaste.

## Control de calidad antes de responder

- El JSON es válido y tiene la misma cantidad de objetos, en el mismo orden.
- `id`, `contexto` y `es` están idénticos al original.
- Todos los números, nombres propios y marcadores del `es` aparecen en `qu` y `ay`.
- Al final, fuera del JSON no escribas nada. Si quieres comentar dudas, hazlo en un segundo mensaje.
