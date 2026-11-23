<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '../../composables/useAuth.js';
import { fmt } from '../../composables/adminLabels.js';

const { authApi } = useAuth();
const docs = ref([]);
const uploading = ref(null); // nombre del archivo mientras se procesa
const query = ref('');
const hits = ref(null);
const error = ref('');
const searching = ref(false);

const ST = { procesado: ['st-ok', 'Procesado'], procesando: ['st-wait', 'Procesando…'], error: ['st-err', 'Error'] };

async function load() {
  try { docs.value = await authApi('/kb/documents'); } catch (err) { error.value = err.message; }
}

// La ingesta se hace en la misma petición: mientras dura, la fila muestra «Procesando…».
async function upload(e) {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  error.value = '';
  uploading.value = f.name;
  const form = new FormData();
  form.append('file', f);
  try { await authApi('/kb/documents', { method: 'POST', form }); } catch (err) { error.value = err.message; }
  uploading.value = null;
  load();
}

async function search() {
  if (!query.value.trim()) { hits.value = []; return; }
  searching.value = true;
  error.value = '';
  try { hits.value = await authApi('/kb/search', { method: 'POST', body: { query: query.value } }); } catch (err) { error.value = err.message; }
  searching.value = false;
}

onMounted(load);
</script>

<template>
  <section>
    <div class="head">
      <div>
        <h2>Base de conocimiento</h2>
        <p>Documentos oficiales que usa el asistente para responder.</p>
      </div>
    </div>
    <div class="upload">
      <p>Sube un archivo TXT o Markdown. Se divide en fragmentos, se generan sus embeddings y se guardan en Supabase.</p>
      <label class="btn" for="fileIn">Subir documento</label>
      <input id="fileIn" type="file" accept=".txt,.md" hidden :disabled="!!uploading" @change="upload">
    </div>
    <p v-if="error" class="error" role="alert" style="color:var(--danger);">{{ error }}</p>
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Documento</th><th>Fuente</th><th>Fragmentos</th><th>Estado</th><th>Actualizado</th></tr></thead>
        <tbody>
          <tr v-if="uploading"><td>{{ uploading }}</td><td>—</td><td>—</td><td class="st-wait">Procesando…</td><td>—</td></tr>
          <tr v-for="d in docs" :key="d.id">
            <td>{{ d.title }}</td>
            <td>{{ d.source }}</td>
            <td>{{ d.status === 'procesado' ? d.chunk_count : '—' }}</td>
            <td :class="ST[d.status][0]">{{ ST[d.status][1] }}</td>
            <td>{{ fmt(d.updated_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card" style="margin-top:24px;">
      <h3>Probar búsqueda</h3>
      <p class="muted">Escribe una pregunta como lo haría una usuaria y revisa qué fragmentos recupera el asistente.</p>
      <form class="search" @submit.prevent="search">
        <input v-model="query" class="text" type="text" placeholder="Por ejemplo: ¿necesito un abogado para denunciar?" aria-label="Pregunta de prueba">
        <button class="btn" type="submit" :disabled="searching">Buscar</button>
      </form>
      <div v-if="hits" class="hits">
        <p v-if="!hits.length" class="muted">No se encontraron fragmentos relevantes. El asistente derivaría a la Línea 100.</p>
        <div v-for="h in hits" :key="h.id" class="hit">
          <div class="row"><span>{{ h.document_title }}</span><span>Similitud {{ h.similarity.toFixed(2) }}</span></div>
          {{ h.content }}
        </div>
      </div>
      <p class="note">Búsqueda por similitud de embeddings con pgvector (los 3 fragmentos más parecidos).</p>
    </div>
  </section>
</template>
