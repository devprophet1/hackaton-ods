<script setup>
import { t } from '../composables/useI18n.js';
</script>

<template>
  <div class="strip" role="region" :aria-label="t('Ayuda inmediata')">
    <span>{{ t('¿Estás en peligro ahora?') }}</span>
    <a href="tel:105">{{ t('Llama al 105 (Policía)') }}</a>
    <a href="tel:100">{{ t('Línea 100, gratuita las 24 horas') }}</a>
    <a href="https://chat100.warminan.gob.pe" target="_blank" rel="noopener">Chat 100</a>
  </div>
</template>
