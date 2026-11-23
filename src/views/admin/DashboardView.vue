<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '../../composables/useAuth.js';
import { TYPE_LABEL } from '../../composables/adminLabels.js';

const { authApi } = useAuth();
const s = ref(null);
const error = ref('');

onMounted(async () => {
  try { s.value = await authApi('/stats/dashboard'); } catch (err) { error.value = err.message; }
});

const bars = (data) => {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return data.map(([k, v]) => ({ k, v, w: (v / max) * 100 + '%' }));
};

const kpis = computed(() => s.value && [
  [s.value.activeCases, 'Casos activos', false],
  [s.value.activeRisk, 'Con riesgo activos', s.value.activeRisk > 0],
  [s.value.avgHoursToFirstContact.toFixed(1) + ' h', 'Promedio hasta el primer contacto', false],
  [s.value.derived, 'Casos derivados', false],
]);
const typeBars = computed(() => s.value && bars(Object.entries(s.value.byViolenceType).map(([k, v]) => [TYPE_LABEL[k] || k, v]).sort((a, b) => b[1] - a[1])));
const statusBars = computed(() => {
  if (!s.value) return [];
  const b = s.value.byStatus;
  return bars([['Pendiente', b.pendiente], ['Contactado', b.contactado], ['Derivado', b.derivado_cem + b.derivado_comisaria], ['Cerrado', b.cerrado]]);
});
const derivBars = computed(() => s.value && bars([['Centro de Emergencia Mujer', s.value.derivations.cem], ['Comisaría', s.value.derivations.comisaria]]));
const week = computed(() => {
  if (!s.value) return [];
  const max = Math.max(1, ...s.value.last7Days.map((d) => d.total));
  return s.value.last7Days.map((d) => ({
    ...d,
    h: (d.total / max) * 100 + '%',
    day: new Date(d.date + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short' }),
  }));
});
</script>

<template>
  <section>
    <div class="head">
      <div>
        <h2>Dashboard</h2>
        <p>Cómo estamos respondiendo a los casos del distrito.</p>
      </div>
      <span class="tag">Datos de demostración</span>
    </div>
    <p v-if="error" class="error" role="alert" style="color:var(--danger);">{{ error }}</p>
    <template v-if="s">
      <div class="kpis">
        <div v-for="[v, l, alert] in kpis" :key="l" class="kpi" :class="{ alert }"><b>{{ v }}</b><span>{{ l }}</span></div>
      </div>
      <div class="panels">
        <div class="card">
          <h3>Tipos de violencia reportados</h3>
          <p class="muted">Incluye reportes anónimos y con contacto.</p>
          <div class="bars"><div v-for="b in typeBars" :key="b.k"><span>{{ b.k }}</span><span><i :style="{ width: b.w }"></i></span><b>{{ b.v }}</b></div></div>
        </div>
        <div class="card">
          <h3>Reportes en los últimos 7 días</h3>
          <div class="cols"><div v-for="d in week" :key="d.date"><span>{{ d.total }}</span><i :style="{ height: d.h }"></i></div></div>
          <div class="cols-labels"><span v-for="d in week" :key="d.date">{{ d.day }}</span></div>
        </div>
        <div class="card">
          <h3>Casos por estado</h3>
          <div class="bars"><div v-for="b in statusBars" :key="b.k"><span>{{ b.k }}</span><span><i :style="{ width: b.w }"></i></span><b>{{ b.v }}</b></div></div>
        </div>
        <div class="card">
          <h3>Derivaciones</h3>
          <div class="bars"><div v-for="b in derivBars" :key="b.k"><span>{{ b.k }}</span><span><i :style="{ width: b.w }"></i></span><b>{{ b.v }}</b></div></div>
          <p class="note">Una derivación se registra al cambiar el estado a «Derivado al CEM» o «Derivado a comisaría».</p>
        </div>
      </div>
    </template>
  </section>
</template>
