<script setup>
import { ref } from 'vue';
import { t } from '../../composables/useI18n.js';
import { openChat } from '../../composables/useUi.js';
import { quickExit } from '../../composables/useQuickExit.js';
import { useGo } from '../../composables/useGo.js';
import { api } from '../../composables/useApi.js';
import { draft, resetDraft } from '../../composables/useReportDraft.js';
import AppAlert from '../../components/AppAlert.vue';

const go = useGo();
const step = ref(1);
const sending = ref(false);
const error = ref('');
const done = ref(null);

const DEVICE = [['si', 'Sí'], ['no', 'No'], ['no_seguro', 'No estoy seguro/a']];
const DANGER = [['si', 'Sí'], ['no', 'No'], ['no_se', 'No sé']];
const MEDIOS = [['sms', 'Mensaje de texto'], ['whatsapp', 'WhatsApp'], ['llamada', 'Llamada']];
const TYPES = [['fisica', 'Física'], ['psicologica', 'Psicológica'], ['sexual', 'Sexual'], ['economica', 'Económica o patrimonial'], ['no_se', 'No sé identificarla']];
const PLACES = ['Vivienda', 'Centro de trabajo o estudios', 'Espacio público', 'Internet o redes sociales', 'Otro lugar'];
const SUPPORT = [['psico', 'Psicológico'], ['legal', 'Legal'], ['medico', 'Médico'], ['info', 'Información general']];
const NEXT = {
  psico: ['Apoyo psicológico', 'Línea 100 o Chat 100: orientación gratuita y especializada las 24 horas.'],
  legal: ['Orientación legal y denuncia', 'Acude a la comisaría más cercana o usa la Central Única de Denuncias.'],
  medico: ['Atención médica', 'Acude al centro de salud más cercano. Si es urgente, llama al 106 (SAMU).'],
  info: ['Información y acompañamiento', 'El Centro de Emergencia Mujer brinda orientación legal, psicológica y social gratuita.'],
};

function toStep(n) {
  step.value = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submit() {
  sending.value = true;
  error.value = '';
  const body = {
    isAnonymous: draft.anon,
    deviceSafe: draft.device || null,
    danger: draft.danger || null,
    violenceTypes: draft.types,
    place: draft.place || null,
    description: draft.description,
    supportTypes: draft.support,
  };
  if (!draft.anon) body.contact = { alias: draft.alias, method: draft.medio, value: draft.numero, safeSchedule: draft.horario };
  try {
    const r = await api('/reports', { method: 'POST', body });
    const medio = MEDIOS.find(([v]) => v === draft.medio)[1];
    done.value = { code: r.code, anon: r.isAnonymous, medio, support: draft.support.length ? [...draft.support] : ['psico'] };
    resetDraft();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    // Lo escrito se conserva en el borrador para reintentar.
    error.value = err.message;
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <section>
    <!-- Confirmación -->
    <div v-if="done" class="done-wrap">
      <h2>{{ t('Gracias por confiar en este espacio') }}</h2>
      <p>{{ done.anon ? t('Tu reporte anónimo quedó registrado. Ayuda a entender qué está pasando en el distrito.') : t('Tu reporte quedó registrado y el equipo de apoyo lo verá en su bandeja.') }}</p>
      <span class="ref">{{ t('Código de referencia (demo):') }} {{ done.code }}</span>
      <h3 style="font-size:1.25rem;">{{ t('Tus próximos pasos') }}</h3>
      <ul class="next">
        <li v-if="!done.anon">
          <strong>{{ t('Te contactaremos') }}</strong>
          <span>{{ t('Una persona del equipo de apoyo te escribirá por {medio} en el horario que indicaste. El primer mensaje no mencionará el motivo.', { medio: t(done.medio).toLowerCase() }) }}</span>
        </li>
        <li v-for="k in done.support" :key="k"><strong>{{ t(NEXT[k][0]) }}</strong><span>{{ t(NEXT[k][1]) }}</span></li>
      </ul>
      <div class="ctas">
        <button class="btn" type="button" @click="openChat">{{ t('Hablar con el asistente') }}</button>
        <button class="btn ghost" type="button" @click="go('/')">{{ t('Volver al inicio') }}</button>
      </div>
    </div>

    <!-- Reporte en 3 pasos -->
    <div v-else class="flow">
      <ol class="progress">
        <li v-for="(label, i) in ['1. Tu seguridad', '2. Lo que pasó', '3. Apoyo']" :key="i" :class="{ done: i + 1 < step, current: i + 1 === step }">{{ t(label) }}</li>
      </ol>
      <p class="reassure">{{ t('Puedes salir en cualquier momento. Nada se guarda hasta que pulses «Enviar reporte».') }}</p>

      <div v-show="step === 1">
        <h2>{{ t('Antes de continuar') }}</h2>
        <p>{{ t('Responde solo si te sientes cómodo/a. Puedes salir en cualquier momento.') }}</p>
        <div class="q">
          <h3>{{ t('¿Es seguro usar este dispositivo ahora?') }}</h3>
          <div class="opts">
            <button v-for="[v, label] in DEVICE" :key="v" class="opt" type="button" :aria-pressed="draft.device === v" @click="draft.device = v">{{ t(label) }}</button>
          </div>
        </div>
        <AppAlert v-if="draft.device === 'no' || draft.device === 'no_seguro'" variant="warn" :title="t('Busca un medio más seguro')">
          {{ t('Si alguien puede revisar este dispositivo, es mejor no continuar aquí. Llama a la Línea 100 o usa el Chat 100 desde otro teléfono o computadora. Es gratuita, atiende las 24 horas y el número es fácil de recordar: 100.') }}
          <template #actions><button class="btn" type="button" @click="quickExit">{{ t('Salir ahora') }}</button></template>
        </AppAlert>
        <div class="q">
          <h3>{{ t('¿Existe peligro inmediato?') }}</h3>
          <div class="opts">
            <button v-for="[v, label] in DANGER" :key="v" class="opt" type="button" :aria-pressed="draft.danger === v" @click="draft.danger = v">{{ t(label) }}</button>
          </div>
        </div>
        <AppAlert v-if="draft.danger === 'si'" :title="t('Tu seguridad es lo primero')">
          {{ t('Busca ayuda inmediata. Puedes volver a este reporte más tarde.') }}
          <template #actions>
            <a class="btn" href="tel:105">{{ t('Llamar al 105') }}</a>
            <a class="btn ghost" href="tel:100">{{ t('Línea 100') }}</a>
          </template>
        </AppAlert>
        <AppAlert v-if="draft.danger === 'no_se'" variant="warn" :title="t('Habla con una especialista')">
          {{ t('Si no sabes si corres peligro, la Línea 100 puede ayudarte a evaluar tu situación. Es gratuita, atiende las 24 horas y también puedes escribir por el Chat 100.') }}
          <template #actions>
            <a class="btn" href="tel:100">{{ t('Llamar a la Línea 100') }}</a>
            <a class="btn ghost" href="https://chat100.warminan.gob.pe" target="_blank" rel="noopener">{{ t('Escribir al Chat 100') }}</a>
            <button class="btn ghost" type="button" @click="openChat">{{ t('Hablar con el asistente') }}</button>
          </template>
        </AppAlert>
        <div class="nav-steps">
          <button class="btn ghost" type="button" @click="go('/')">{{ t('Volver') }}</button>
          <button class="btn" type="button" @click="toStep(2)">{{ t('Continuar') }}</button>
        </div>
      </div>

      <div v-show="step === 2">
        <h2>{{ t('Lo que pasó') }}</h2>
        <p>{{ t('Cuenta solo lo que consideres necesario. Ningún campo es obligatorio.') }}</p>
        <div class="q switch-row">
          <div>
            <h3 style="margin:0;">{{ t('Enviar de forma anónima') }}</h3>
            <p>{{ t('Si lo desactivas, una persona del equipo de apoyo podrá contactarte.') }}</p>
          </div>
          <label class="switch" :aria-label="t('Enviar de forma anónima')">
            <input v-model="draft.anon" type="checkbox"><span class="track"></span><span class="thumb"></span>
          </label>
        </div>

        <div v-if="!draft.anon" class="q contact-block">
          <h3>{{ t('¿Cómo podemos contactarte de forma segura?') }}</h3>
          <p class="hint">{{ t('Solo te contactaremos por este medio y en este horario. El primer mensaje no mencionará el motivo.') }}</p>
          <div class="field">
            <label for="alias">{{ t('Nombre o seudónimo') }}</label>
            <input id="alias" v-model="draft.alias" class="text" type="text" :placeholder="t('Por ejemplo, Rosa')">
          </div>
          <div class="field">
            <label for="medio">{{ t('Medio seguro') }}</label>
            <select id="medio" v-model="draft.medio">
              <option v-for="[v, label] in MEDIOS" :key="v" :value="v">{{ t(label) }}</option>
            </select>
          </div>
          <div class="field">
            <label for="numero">{{ t('Número de contacto') }}</label>
            <input id="numero" v-model="draft.numero" class="text" type="text" inputmode="tel" placeholder="9XX XXX XXX">
          </div>
          <div class="field" style="margin:0;">
            <label for="horario">{{ t('Horario seguro para contactarte') }}</label>
            <input id="horario" v-model="draft.horario" class="text" type="text" :placeholder="t('Por ejemplo, lunes a viernes de 9 a 11 a. m.')">
          </div>
        </div>

        <fieldset class="q">
          <legend>{{ t('¿Qué tipo de violencia deseas registrar?') }}</legend>
          <p class="hint">{{ t('Puedes marcar más de una. Categorías de la Ley N.º 30364.') }}</p>
          <div class="opts">
            <label v-for="[v, label] in TYPES" :key="v" class="pill"><input v-model="draft.types" type="checkbox" :value="v"> {{ t(label) }}</label>
          </div>
        </fieldset>
        <fieldset class="q">
          <legend>{{ t('¿Dónde ocurrió?') }}</legend>
          <select v-model="draft.place" :aria-label="t('Lugar del incidente')">
            <option value="">{{ t('Prefiero no responder') }}</option>
            <option v-for="p in PLACES" :key="p" :value="p">{{ t(p) }}</option>
          </select>
        </fieldset>
        <fieldset class="q">
          <legend>{{ t('¿Quieres contar algo más?') }}</legend>
          <p class="hint">{{ t('No necesitas escribir detalles que te hagan sentir incómodo/a.') }}</p>
          <textarea v-model="draft.description" :aria-label="t('Descripción opcional')" :placeholder="t('Puedes dejarlo en blanco.')"></textarea>
        </fieldset>
        <div class="nav-steps">
          <button class="btn ghost" type="button" @click="toStep(1)">{{ t('Atrás') }}</button>
          <button class="btn" type="button" @click="toStep(3)">{{ t('Continuar') }}</button>
        </div>
      </div>

      <div v-show="step === 3">
        <h2>{{ t('¿Qué apoyo necesitas?') }}</h2>
        <p>{{ t('Según lo que elijas, te mostraremos a dónde acudir.') }}</p>
        <fieldset class="q">
          <legend>{{ t('Tipo de apoyo') }}</legend>
          <div class="opts">
            <label v-for="[v, label] in SUPPORT" :key="v" class="pill"><input v-model="draft.support" type="checkbox" :value="v"> {{ t(label) }}</label>
          </div>
        </fieldset>
        <AppAlert v-if="error" title="No pudimos enviar tu reporte">
          {{ error }} Lo que escribiste sigue aquí. Si necesitas ayuda ahora, llama a la Línea 100 (gratuita, las 24 horas).
          <template #actions>
            <button class="btn" type="button" :disabled="sending" @click="submit">Reintentar</button>
            <a class="btn ghost" href="tel:100">{{ t('Llamar a la Línea 100') }}</a>
          </template>
        </AppAlert>
        <div class="nav-steps">
          <button class="btn ghost" type="button" @click="toStep(2)">{{ t('Atrás') }}</button>
          <button class="btn" type="button" :disabled="sending" @click="submit">{{ t('Enviar reporte') }}</button>
        </div>
      </div>
    </div>
  </section>
</template>
