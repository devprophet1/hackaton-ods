<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuth } from '../../composables/useAuth.js';
import { TYPE_LABEL, SUPPORT_LABEL, METHOD_LABEL, STATUS_OPTIONS, statusBadge, fmt, ago, labels, riskPending } from '../../composables/adminLabels.js';

const { authApi } = useAuth();
const FILTERS = [['all', 'Todos'], ['risk', 'Con riesgo'], ['pending', 'Pendientes'], ['mine', 'Mis casos'], ['unassigned', 'Sin asignar'], ['closed', 'Cerrados']];

const filter = ref('all');
const cases = ref([]);
const overdue = ref([]);
const selectedId = ref(null);
const detail = ref(null);
const staff = ref([]);
const revealed = reactive({}); // contactos mostrados en esta sesión (solo en memoria)
const note = ref('');
const error = ref('');
let timer;

const open = (c) => c.hasRisk && c.status !== 'cerrado';
const methodLabel = computed(() => METHOD_LABEL[detail.value?.contact.method] || 'Contacto');

async function loadList() {
  try {
    const r = await authApi('/cases?filter=' + filter.value);
    cases.value = r.cases;
    overdue.value = r.summary.overdueRisk;
    riskPending.value = r.summary.riskPending;
    error.value = '';
    if (!cases.value.find((c) => c.id === selectedId.value)) selectedId.value = cases.value[0]?.id || null;
    await loadDetail();
  } catch (err) {
    error.value = err.message;
  }
}

async function loadDetail() {
  if (!selectedId.value) { detail.value = null; return; }
  detail.value = await authApi('/cases/' + selectedId.value);
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

async function act(fn) {
  try { detail.value = await fn(); await loadList(); } catch (err) { error.value = err.message; }
}

async function reveal() {
  const id = detail.value.id;
  try {
    revealed[id] = (await authApi(`/cases/${id}/contact-access`, { method: 'POST' })).value;
    await loadDetail();
  } catch (err) { error.value = err.message; }
}

const assign = (e) => act(() => authApi(`/cases/${detail.value.id}/assign`, { method: 'PATCH', body: { staffId: e.target.value || null } }));
const setStatus = (e) => act(() => authApi(`/cases/${detail.value.id}/status`, { method: 'PATCH', body: { status: e.target.value } }));
async function saveNote() {
  const text = note.value.trim();
  if (!text) return;
  await act(() => authApi(`/cases/${detail.value.id}/notes`, { method: 'POST', body: { text } }));
  note.value = '';
}

onMounted(async () => {
  loadList();
  try { staff.value = await authApi('/staff'); } catch { /* el selector queda vacío */ }
  timer = setInterval(loadList, 30_000); // refresco de la bandeja
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <section>
    <div class="head">
      <div>
        <h2>Casos</h2>
        <p>Reportes con datos de contacto. Los de riesgo aparecen primero.</p>
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
            <div class="row"><small>{{ labels(c.violenceTypes, TYPE_LABEL) }}</small><span v-if="open(c)" class="badge urg">Riesgo</span></div>
            <small>{{ c.assignedTo?.fullName || 'Sin asignar' }}  |  {{ ago(c.createdAt) }}</small>
          </button>
        </li>
      </ul>

      <div class="detail">
        <p v-if="!detail" class="muted">Selecciona un caso para ver el detalle.</p>
        <template v-else>
          <div class="row">
            <h3>{{ detail.alias }}</h3>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <span v-if="open(detail)" class="badge urg">Marcó peligro inmediato</span>
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
              <button v-if="!revealed[detail.id]" class="reveal" type="button" @click="reveal">Mostrar</button>
            </dd>
            <dt>Horario seguro</dt><dd>{{ detail.contact.safeSchedule }}</dd>
          </dl>

          <div class="script">
            <b>Primer mensaje sugerido (neutro)</b>
            {{ detail.contact.method === 'llamada'
              ? 'Hola, te llamo por tu consulta. ¿Puedes hablar ahora con tranquilidad?'
              : 'Hola, te escribimos por tu consulta. ¿Es un buen momento para conversar?' }}
          </div>

          <div class="grid2">
            <div class="field" style="margin:0;">
              <label for="assign">Asignado a</label>
              <select id="assign" :value="detail.assignedTo?.id || ''" @change="assign">
                <option value="">Sin asignar</option>
                <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.fullName }}</option>
              </select>
            </div>
            <div class="field" style="margin:0;">
              <label for="status">Estado</label>
              <select id="status" :value="detail.status" @change="setStatus">
                <option v-for="[v, label] in STATUS_OPTIONS" :key="v" :value="v">{{ label }}</option>
              </select>
            </div>
          </div>

          <textarea v-model="note" placeholder="Nota interna del seguimiento" aria-label="Nota interna"></textarea>
          <button class="btn ghost" type="button" style="margin-top:10px;" @click="saveNote">Guardar nota</button>

          <ul class="timeline">
            <li v-for="ev in detail.events" :key="ev.id"><time>{{ fmt(ev.createdAt) }}</time><span>{{ ev.detail }}</span></li>
          </ul>
        </template>
      </div>
    </div>
  </section>
</template>
