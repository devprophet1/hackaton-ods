<script setup>
import { t } from '../composables/useI18n.js';
import { quickExit } from '../composables/useQuickExit.js';
</script>

<template>
  <button class="exit" type="button" :title="t('También puedes presionar Esc tres veces')" @click="quickExit">
    {{ t('Salir rápido') }}
  </button>
</template>
