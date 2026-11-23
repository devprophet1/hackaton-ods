<script setup>
import { t } from '../composables/useI18n.js';
import { LogOut } from 'lucide-vue-next';
import { quickExit } from '../composables/useQuickExit.js';
import AppIcon from './AppIcon.vue';
</script>

<template>
  <button class="exit" type="button" :title="t('También puedes presionar Esc tres veces')" @click="quickExit">
    <AppIcon :icon="LogOut" />{{ t('Salir rápido') }}
  </button>
</template>
