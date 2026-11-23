<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { TriangleAlert, Eye, StickyNote, Save, Sparkles, BookOpen } from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth.js';
import AppIcon from '../../components/AppIcon.vue';
import { TYPE_LABEL, SUPPORT_LABEL, METHOD_LABEL, STATUS_OPTIONS, DERIVED_OPTIONS, statusBadge, fmt, ago, labels, riskPending } from '../../composables/adminLabels.js';

const { authApi } = useAuth();
const FILTERS = [['all', 'Todos'], ['risk', 'Con riesgo'], ['pending', 'Pendientes'], ['contacted', 'Contactados'], ['derived', 'Derivados'], ['closed', 'Cerrados']];

const filter = ref('all');
const cases = ref([]);
const overdue = ref([]);
const selectedId = ref(null);
const detail = ref(null);
const revealed = reactive({}); // contactos mostrados en esta sesión (solo en memoria)
const note = ref('');
const error = ref('');
const saving = ref(false);
// Formulario de seguimiento (estado, quién contacta y derivación).
const form = reactive({ status: 'pendiente', contactPerson: '', derivedTo: 'cem', derivedEntity: '' });
// Análisis de apoyo (IA): solo en memoria, por caso.
const analyses = reactive({});
const analyzing = ref(false);
let timer;

const open = (c) => c.hasRisk && c.status !== 'cerrado';
const methodLabel = computed(() => METHOD_LABEL[detail.value?.contact.method] || 'Contacto');
const needsContact = computed(() => form.status !== 'pendiente');
const isDerived = computed(() => form.status === 'derivado');

// Línea de la tarjeta: «Derivado a: …» o «Contacto: …».
const cardLine = (c) => (c.status === 'derivado' && c.derivedName ? `Derivado a: ${c.derivedName}` : c.status !== 'pendiente' && c.contactPerson ? `Contacto: ${c.contactPerson}` : '');

function fillForm(d) {
  form.status = d.status;
  form.contactPerson = d.contactPerson || '';
  form.derivedTo = d.derivedTo || 'cem';
  form.derivedEntity = d.derivedEntity || '';
}

async function loadList() {
  try {
    const r = await authApi('/cases?filter=' + filter.value);
    cases.value = r.cases;
    overdue.value = r.summary.overdueRisk;
    riskPending.value = r.summary.riskPending;
    error.value = '';
    if (!cases.value.find((c) => c.id === selectedId.value)) selectedId.value = cases.value[0]?.id || null;
    await loadDetail(true);
  } catch (err) {
    error.value = err.message;
  }
}

// keepForm: al refrescar no se pisa lo que la persona está escribiendo en el mismo caso.
async function loadDetail(keepForm = false) {
  if (!selectedId.value) { detail.value = null; return; }
  const d = await authApi('/cases/' + selectedId.value);
  const changed = detail.value?.id !== d.id;
  detail.value = d;
  if (changed || !keepForm) fillForm(d);
}

function select(id) {
  selectedId.value = id;
  note.value = '';
  loadDetail();
}

function setFilter(k) {
  filter.value = k;
  selectedId.value = null;
  loadList();
}

function seeNow() {
  const first = overdue.value[0];
  filter.value = 'risk';
  selectedId.value = first;
  loadList();
}

async function reveal() {
  const id = detail.value.id;
  try {
    revealed[id] = (await authApi(`/cases/${id}/contact-access`, { method: 'POST' })).value;
    await loadDetail(true);
  } catch (err) { error.value = err.message; }
}

async function saveFollowUp() {
  saving.value = true;
  try {
    const body = { status: form.status, contactPerson: form.contactPerson, derivedTo: form.derivedTo, derivedEntity: form.derivedEntity };
    detail.value = await authApi(`/cases/${detail.value.id}/follow-up`, { method: 'PATCH', body });
    fillForm(detail.value);
    await loadList();
  } catch (err) { error.value = err.message; }
  saving.value = false;
}

async function saveNote() {
  const text = note.value.trim();
  if (!text) return;
  try {
    detail.value = await authApi(`/cases/${detail.value.id}/notes`, { method: 'POST', body: { text } });
    note.value = '';
  } catch (err) { error.value = err.message; }
}

// Divide el análisis en títulos («Resumen:»), listas («- …») y párrafos. Sin HTML del modelo.
function analysisBlocks(textValue) {
  const out = [];
  for (const line of String(textValue || '').split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (/^[-•]\s+/.test(line)) {
      const item = line.replace(/^[-•]\s+/, '');
      if (out.at(-1)?.type === 'list') out.at(-1).items.push(item); else out.push({ type: 'list', items: [item] });
    } else if (/^[A-ZÁÉÍÓÚÑ][^.]{2,40}:$/.test(line)) out.push({ type: 'h', text: line.slice(0, -1) });
    else out.push({ type: 'p', text: line });
  }
  return out;
}

async function analyze() {
  const id = detail.value.id;
  analyzing.value = true;
  try { analyses[id] = await authApi(`/cases/${id}/analysis`, { method: 'POST' }); } catch (err) { error.value = err.message; }
  analyzing.value = false;
}

onMounted(() => {
  loadList();
  timer = setInterval(() => { if (!saving.value) loadList(); }, 30_000); // refresco de la bandeja
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <section>
    <div class="head">
      <div>
        <h2>Casos</h2>
        <p>Reportes con datos de contacto. Los de riesgo pendientes aparecen primero.</p>
      </div>
      <span class="tag">Datos de demostración</span>
    </div>

    <div v-if="overdue.length" class="warn">
      <span>{{ overdue.length === 1 ? '1 caso con riesgo lleva más de 1 hora sin contacto.' : `${overdue.length} casos con riesgo llevan más de 1 hora sin contacto.` }}</span>
      <button type="button" @click="seeNow">Ver ahora</button>
    </div>
    <p v-if="error" class="error" role="alert" style="color:var(--danger);">{{ error }}</p>

    <div class="filters">
      <button v-for="[k, label] in FILTERS" :key="k" class="chip" type="button" :aria-pressed="filter === k" @click="setFilter(k)">{{ label }}</button>
    </div>

    <div class="board">
      <ul class="cases">
        <li v-if="!cases.length" class="empty">No hay casos con este filtro.</li>
        <li v-for="c in cases" :key="c.id">
          <button class="case" :class="{ urgent: open(c) }" type="button" :aria-current="c.id === selectedId" @click="select(c.id)">
            <div class="row"><strong>{{ c.alias }}</strong><span :class="statusBadge(c.status).cls">{{ statusBadge(c.status).label }}</span></div>
            <div class="row"><small>{{ labels(c.violenceTypes, TYPE_LABEL) }}</small><span v-if="open(c)" class="badge urg"><AppIcon :icon="TriangleAlert" :size="14" />Riesgo</span></div>
            <small v-if="cardLine(c)" class="card-line">{{ cardLine(c) }}</small>
            <small>{{ ago(c.createdAt) }}</small>
          </button>
        </li>
      </ul>

      <div class="detail">
        <p v-if="!detail" class="muted">Selecciona un caso para ver el detalle.</p>
        <template v-else>
          <div class="row">
            <h3>{{ detail.alias }}</h3>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <span v-if="open(detail)" class="badge urg"><AppIcon :icon="TriangleAlert" :size="14" />Marcó peligro inmediato</span>
              <span :class="statusBadge(detail.status).cls">{{ statusBadge(detail.status).label }}</span>
            </div>
          </div>
          <small class="muted">{{ detail.code }}  |  recibido {{ fmt(detail.createdAt) }}</small>

          <dl class="facts">
            <dt>Tipo de violencia</dt><dd>{{ labels(detail.violenceTypes, TYPE_LABEL) }}</dd>
            <dt>Lugar</dt><dd>{{ detail.place || 'No indicado' }}</dd>
            <dt>Apoyo pedido</dt><dd>{{ labels(detail.supportTypes, SUPPORT_LABEL) }}</dd>
            <dt>Contacto</dt>
            <dd>
              {{ methodLabel }}: {{ revealed[detail.id] || detail.contact.masked }}
              <button v-if="!revealed[detail.id]" class="reveal" type="button" @click="reveal"><AppIcon :icon="Eye" />Mostrar</button>
            </dd>
            <dt>Horario seguro</dt><dd>{{ detail.contact.safeSchedule }}</dd>
            <template v-if="detail.status !== 'pendiente' && detail.contactPerson"><dt>Quién la contacta</dt><dd>{{ detail.contactPerson }}</dd></template>
            <template v-if="detail.status === 'derivado' && detail.derivedName"><dt>Derivado a</dt><dd>{{ detail.derivedName }}</dd></template>
          </dl>

          <div class="script">
            <b>Primer mensaje sugerido (neutro)</b>
            {{ detail.contact.method === 'llamada'
              ? 'Hola, te llamo por tu consulta. ¿Puedes hablar ahora con tranquilidad?'
              : 'Hola, te escribimos por tu consulta. ¿Es un buen momento para conversar?' }}
          </div>

          <!-- Análisis de apoyo (IA): orientativo, la decisión es del equipo -->
          <div class="analysis">
            <div class="row">
              <b class="lbl-ico"><AppIcon :icon="Sparkles" />Análisis de apoyo</b>
              <button class="btn ghost small" type="button" :disabled="analyzing" @click="analyze">
                {{ analyzing ? 'Analizando…' : analyses[detail.id] ? 'Volver a analizar' : 'Generar análisis' }}
              </button>
            </div>
            <p v-if="!analyses[detail.id] && !analyzing" class="muted">Resume el caso, señala lo que requiere atención y sugiere opciones con la guía de Rimay. Es orientativo: la decisión es del equipo.</p>
            <div v-if="analyses[detail.id]" class="analysis-body">
              <template v-for="(bl, i) in analysisBlocks(analyses[detail.id].analysis)" :key="i">
                <h4 v-if="bl.type === 'h'">{{ bl.text }}</h4>
                <ul v-else-if="bl.type === 'list'"><li v-for="(it, j) in bl.items" :key="j">{{ it }}</li></ul>
                <p v-else>{{ bl.text }}</p>
              </template>
              <small v-if="analyses[detail.id].sources.length" class="src lbl-ico"><AppIcon :icon="BookOpen" :size="14" />Guía usada: {{ analyses[detail.id].sources.join(', ') }}</small>
            </div>
          </div>

          <!-- Seguimiento: estado, quién contacta y derivación -->
          <form class="follow" @submit.prevent="saveFollowUp">
            <div class="grid2">
              <div class="field" style="margin:0;">
                <label for="status">Estado</label>
                <select id="status" v-model="form.status">
                  <option v-for="[v, label] in STATUS_OPTIONS" :key="v" :value="v">{{ label }}</option>
                </select>
              </div>
              <div v-if="isDerived" class="field" style="margin:0;">
                <label for="derivedTo">Derivado a</label>
                <select id="derivedTo" v-model="form.derivedTo">
                  <option v-for="[v, label] in DERIVED_OPTIONS" :key="v" :value="v">{{ label }}</option>
                </select>
              </div>
            </div>
            <div v-if="isDerived && form.derivedTo === 'otra'" class="field">
              <label for="derivedEntity">Nombre de la entidad</label>
              <input id="derivedEntity" v-model="form.derivedEntity" class="text" type="text" autocomplete="off" placeholder="Por ejemplo, DEMUNA de Villa El Salvador…">
            </div>
            <div v-if="needsContact" class="field">
              <label for="contactPerson">¿Quién la contacta?</label>
              <input id="contactPerson" v-model="form.contactPerson" class="text" type="text" autocomplete="off" placeholder="Por ejemplo, Lic. Ana Torres, psicóloga del CEM…">
            </div>
            <button class="btn" type="submit" :disabled="saving"><AppIcon :icon="Save" />{{ saving ? 'Guardando…' : 'Guardar cambios' }}</button>
          </form>

          <textarea v-model="note" placeholder="Nota interna del seguimiento" aria-label="Nota interna"></textarea>
          <button class="btn ghost" type="button" style="margin-top:10px;" @click="saveNote"><AppIcon :icon="StickyNote" />Guardar nota</button>

          <ul class="timeline">
            <li v-for="ev in detail.events" :key="ev.id"><time>{{ fmt(ev.createdAt) }}</time><span>{{ ev.detail }}</span></li>
          </ul>
        </template>
      </div>
    </div>
  </section>
</template>
