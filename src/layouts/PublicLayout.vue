<script setup>
import '../assets/public.css';
import { useI18n } from '../composables/useI18n.js';
import { useQuickExit } from '../composables/useQuickExit.js';
import EmergencyStrip from '../components/EmergencyStrip.vue';
import SiteHeader from '../components/SiteHeader.vue';
import SideMenu from '../components/SideMenu.vue';
import AssistantWidget from '../components/AssistantWidget.vue';

useI18n();
useQuickExit(); // Esc tres veces en toda la web pública
</script>

<template>
  <div class="pub">
    <EmergencyStrip />
    <SiteHeader />
    <SideMenu />
    <main>
      <RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="route.path" class="view" />
      </RouterView>
    </main>
    <AssistantWidget />
  </div>
</template>
