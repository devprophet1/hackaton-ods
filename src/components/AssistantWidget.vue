<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import { chatOpen, toggleChat } from '../composables/useUi.js';
import { api } from '../composables/useApi.js';

const { lang, t } = useI18n();
const GREET = { es: 'Hola.', qu: 'Allillanchu.', ay: 'Kamisaraki.' };
const greeting = computed(() => `${GREET[lang.value]} ${t('Puedo orientarte sobre qué hacer, a dónde acudir y qué dice la ley. Elige una pregunta o escribe la tuya.')}`);
const chips = ['¿Dónde pido ayuda?', '¿Qué dice la ley?', '¿Cómo denuncio?', '¿Cómo ayudo a alguien?'];

// Solo en memoria: la conversación no se guarda en ningún lado.
const messages = reactive([]);
const input = ref('');
const busy = ref(false);
const list = ref(null);
const field = ref(null);
let seq = 0;

const scroll = async () => { await nextTick(); if (list.value) list.value.scrollTop = list.value.scrollHeight; };

watch(chatOpen, async (open) => { if (open) { await nextTick(); field.value?.focus(); } });

async function ask(text) {
  const q = text.trim();
  if (!q || busy.value) return;
  messages.push({ id: ++seq, role: 'me', text: q });
  busy.value = true;
  scroll();
  try {
    const r = await api('/rag/chat', { method: 'POST', body: { message: q } });
    if (r.risk) messages.push({ id: ++seq, role: 'risk' });
    else messages.push({ id: ++seq, role: 'bot', text: r.answer, sources: (r.sources || []).map((s) => s.title).join(', ') });
  } catch (err) {
    messages.push({ id: ++seq, role: 'bot', text: `${err.message} Si necesitas hablar con alguien ahora, llama a la Línea 100 (gratuita, las 24 horas).` });
  } finally {
    busy.value = false;
    scroll();
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /></svg>
    <span class="label">{{ t('¿Necesitas orientación?') }}</span>
  </button>

  <div id="chatbox" class="chatbox" :class="{ open: chatOpen }" role="dialog" :aria-label="t('Asistente de orientación')">
    <div class="chat-head">
      <span class="dot" aria-hidden="true"></span>
      <div>
        <h3>{{ t('Asistente de orientación') }}</h3>
        <p>{{ t('No reemplaza la atención profesional ni una denuncia oficial.') }}</p>
      </div>
      <button type="button" :aria-label="t('Cerrar asistente')" @click="toggleChat">×</button>
    </div>
    <div ref="list" class="msgs" aria-live="polite">
      <div class="b bot">{{ greeting }}</div>
      <template v-for="m in messages" :key="m.id">
        <div v-if="m.role === 'risk'" class="b bot risk">
          <strong>{{ t('Lo que cuentas es serio y tu seguridad es lo primero.') }}</strong><br>
          {{ t('Si estás en peligro ahora, busca ayuda inmediata:') }}<br>
          <a href="tel:105">{{ t('Llamar al 105') }}</a><a href="tel:100">{{ t('Línea 100') }}</a>
        </div>
        <div v-else class="b" :class="m.role">
          {{ m.text }}
          <span v-if="m.sources" class="src">{{ t('Fuente:') }} {{ m.sources }}</span>
        </div>
      </template>
      <div v-if="busy" class="b bot"><span class="typing" :aria-label="t('Escribiendo')"><i></i><i></i><i></i></span></div>
    </div>
    <div class="chips">
      <button v-for="c in chips" :key="c" type="button" @click="ask(t(c))">{{ t(c) }}</button>
    </div>
    <form class="compose" @submit.prevent="send">
      <input ref="field" v-model="input" type="text" :placeholder="t('Escribe tu pregunta')" autocomplete="off" :aria-label="t('Tu pregunta')">
      <button type="submit" :aria-label="t('Enviar')">➤</button>
    </form>
  </div>
</template>
