<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { MessageCircle, Send, X, Phone, BookOpen, TriangleAlert } from 'lucide-vue-next';
import { useI18n } from '../composables/useI18n.js';
import { chatOpen, toggleChat } from '../composables/useUi.js';
import { api } from '../composables/useApi.js';
import AppIcon from './AppIcon.vue';
import RichText from './RichText.vue';
import RimayLogo from './RimayLogo.vue';

const { lang, t } = useI18n();
const GREET = { es: 'Hola.', qu: 'Allillanchu.', ay: 'Kamisaraki.' };
const greeting = computed(() => `${GREET[lang.value]} ${t('Puedo orientarte sobre qué hacer, a dónde acudir y qué dice la ley. Elige una pregunta o escribe la tuya.')}`);
const START = ['¿Dónde pido ayuda?', '¿Qué dice la ley?', '¿Cómo denuncio?', '¿Cómo ayudo a alguien?'];
const RISK_TEXT = 'Lo que cuentas es serio y tu seguridad es lo primero. Si estás en peligro ahora, llama al 105 o a la Línea 100.';

// La conversación vive solo en la memoria de esta página: no se guarda en el servidor ni en el navegador,
// y se pierde al cerrar la pestaña o al usar «Salir rápido».
const messages = reactive([]);
const input = ref('');
const busy = ref(false);
const list = ref(null);
const field = ref(null);
let seq = 0;

// Sugerencias: las 4 fijas al inicio; después, las que propone la última respuesta.
const suggestions = computed(() => {
  if (!messages.length) return START.map((c) => t(c));
  const last = [...messages].reverse().find((m) => m.role !== 'me');
  return last?.suggestions || [];
});

// Últimos 6 mensajes para que el asistente entienda preguntas de seguimiento.
const history = () => messages.slice(-6).map((m) => ({
  role: m.role === 'me' ? 'user' : 'assistant',
  content: m.role === 'risk' ? (m.answer || RISK_TEXT) : m.text,
}));

// Divide la respuesta en párrafos y listas (líneas que empiezan con «-», «•» o «1.»). Sin HTML del modelo.
const LIST_ITEM = /^\s*(?:[-•*]|\d+[.)])\s+/;
function blocks(text) {
  const out = [];
  for (const line of String(text || '').split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (LIST_ITEM.test(line)) {
      const item = line.replace(LIST_ITEM, '');
      if (out.at(-1)?.type === 'list') out.at(-1).items.push(item);
      else out.push({ type: 'list', items: [item] });
    } else out.push({ type: 'p', text: line });
  }
  return out;
}

const scroll = async () => { await nextTick(); if (list.value) list.value.scrollTop = list.value.scrollHeight; };

watch(chatOpen, async (open) => { if (open) { await nextTick(); field.value?.focus(); } });

async function ask(text) {
  const q = text.trim();
  if (!q || busy.value) return;
  const past = history();
  messages.push({ id: ++seq, role: 'me', text: q });
  busy.value = true;
  scroll();
  try {
    const r = await api('/rag/chat', { method: 'POST', body: { message: q, history: past } });
    if (r.risk) messages.push({ id: ++seq, role: 'risk', riskType: r.riskType || 'violencia', answer: r.answer, suggestions: r.suggestions || [] });
    else messages.push({ id: ++seq, role: 'bot', text: r.answer, sources: (r.sources || []).map((s) => s.title).join(', '), suggestions: r.suggestions || [] });
  } catch (err) {
    messages.push({ id: ++seq, role: 'bot', text: `${err.message} Si necesitas hablar con alguien ahora, llama a la Línea 100 (gratuita, las 24 horas).` });
  } finally {
    busy.value = false;
    scroll();
    field.value?.focus();
  }
}

function send() {
  const q = input.value;
  input.value = '';
  ask(q);
}
</script>

<template>
  <button id="fab" class="fab" type="button" :aria-expanded="chatOpen" aria-controls="chatbox" @click="toggleChat">
    <AppIcon :icon="MessageCircle" :size="22" />
    <span class="label">{{ t('¿Necesitas orientación?') }}</span>
  </button>

  <div id="chatbox" class="chatbox" :class="{ open: chatOpen }" role="dialog" :aria-label="t('Asistente de orientación')">
    <div class="chat-head">
      <span class="avatar lg" aria-hidden="true"><RimayLogo :size="26" /></span>
      <div>
        <h3>{{ t('Asistente de orientación') }}</h3>
        <p>{{ t('No reemplaza la atención profesional ni una denuncia oficial.') }}</p>
      </div>
      <button type="button" class="close" :aria-label="t('Cerrar asistente')" @click="toggleChat"><AppIcon :icon="X" :size="20" /></button>
    </div>

    <div ref="list" class="msgs" aria-live="polite">
      <div class="row bot">
        <span class="avatar" aria-hidden="true"><RimayLogo :size="18" /></span>
        <div class="b bot"><p>{{ greeting }}</p></div>
      </div>

      <template v-for="m in messages" :key="m.id">
        <div v-if="m.role === 'me'" class="row me"><div class="b me"><p>{{ m.text }}</p></div></div>

        <div v-else-if="m.role === 'risk'" class="row bot">
          <span class="avatar" aria-hidden="true"><RimayLogo :size="18" /></span>
          <div class="b bot risk">
            <strong class="risk-title"><AppIcon :icon="TriangleAlert" :size="18" />
              {{ m.riskType === 'crisis' ? t('No tienes que pasar por esto a solas.') : t('Lo que cuentas es serio y tu seguridad es lo primero.') }}
            </strong>
            <p v-if="m.riskType === 'crisis'">{{ t('Puedes hablar ahora mismo, gratis y a cualquier hora, con alguien que te escuche:') }}</p>
            <p v-else>{{ t('Si estás en peligro ahora, busca ayuda inmediata:') }}</p>
            <div class="risk-links">
              <a href="tel:105"><AppIcon :icon="Phone" :size="18" />{{ t('Llamar al 105') }}</a>
              <a href="tel:100"><AppIcon :icon="Phone" :size="18" />{{ t('Línea 100') }}</a>
              <a v-if="m.riskType === 'crisis'" href="tel:113"><AppIcon :icon="Phone" :size="18" />{{ t('Línea 113, opción 5 (salud mental)') }}</a>
            </div>
          </div>
        </div>

        <div v-else class="row bot">
          <span class="avatar" aria-hidden="true"><RimayLogo :size="18" /></span>
          <div class="b bot">
            <template v-for="(bl, i) in blocks(m.text)" :key="i">
              <ul v-if="bl.type === 'list'"><li v-for="(it, j) in bl.items" :key="j"><RichText :text="it" /></li></ul>
              <p v-else><RichText :text="bl.text" /></p>
            </template>
            <span v-if="m.sources" class="src"><AppIcon :icon="BookOpen" :size="14" />{{ t('Fuente:') }} {{ m.sources }}</span>
          </div>
        </div>
      </template>

      <div v-if="busy" class="row bot">
        <span class="avatar" aria-hidden="true"><RimayLogo :size="18" /></span>
        <div class="b bot"><span class="typing" :aria-label="t('Escribiendo')"><i></i><i></i><i></i></span></div>
      </div>
    </div>

    <div v-if="suggestions.length" class="chips">
      <button v-for="c in suggestions" :key="c" type="button" :disabled="busy" @click="ask(c)">{{ c }}</button>
    </div>

    <div class="human">
      <AppIcon :icon="Phone" :size="18" />
      <span>{{ t('Hablar con una persona') }}:</span>
      <a href="tel:100">{{ t('Línea 100') }}</a>
      <a href="https://chat100.warminan.gob.pe" target="_blank" rel="noopener">Chat 100</a>
    </div>

    <form class="compose" @submit.prevent="send">
      <input ref="field" v-model="input" type="text" :placeholder="t('Escribe tu pregunta')" autocomplete="off" :aria-label="t('Tu pregunta')">
      <button type="submit" :aria-label="t('Enviar')"><AppIcon :icon="Send" :size="18" /></button>
    </form>
  </div>
</template>
