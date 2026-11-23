<script setup>
import '../assets/admin.css';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';
import { riskPending } from '../composables/adminLabels.js';
import RimayLogo from '../components/RimayLogo.vue';

const route = useRoute();
const router = useRouter();
const { user, isLoggedIn, logout, authApi } = useAuth();
const ROLE = { coordinadora: 'Coordinadora', gestora: 'Gestora de casos', admin: 'Administración' };
const nav = [['admin-cases', '/admin/casos', 'Casos'], ['admin-dashboard', '/admin/dashboard', 'Dashboard'], ['admin-kb', '/admin/conocimiento', 'Base de conocimiento']];

onMounted(async () => {
  if (!isLoggedIn.value) return;
  try { riskPending.value = (await authApi('/cases?filter=all')).summary.riskPending; } catch { /* se reintenta en Casos */ }
});

function out() {
  logout();
  router.push({ name: 'admin-login' });
}
</script>

<template>
  <div class="admin">
    <RouterView v-if="route.name === 'admin-login'" />
    <div v-else class="app">
      <aside class="side">
        <div class="logo"><RimayLogo :size="34" /> Rimay</div>
        <nav aria-label="Módulos">
          <RouterLink v-for="[name, path, label] in nav" :key="name" :to="path" :aria-current="route.name === name ? 'page' : 'false'">
            {{ label }}
            <span v-if="name === 'admin-cases' && riskPending" class="count">{{ riskPending }}</span>
          </RouterLink>
        </nav>
        <div class="user">
          <div><strong>{{ user?.fullName }}</strong><span>{{ ROLE[user?.role] || user?.role }}</span></div>
          <button class="btn ghost" type="button" @click="out">Cerrar sesión</button>
        </div>
      </aside>
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
