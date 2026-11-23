<script setup>
import { Phone, MessageCircle } from 'lucide-vue-next';
import { t } from '../composables/useI18n.js';
import AppIcon from './AppIcon.vue';
</script>

<template>
  <div class="strip" role="region" :aria-label="t('Ayuda inmediata')">
    <span>{{ t('¿Estás en peligro ahora?') }}</span>
    <a href="tel:105"><AppIcon :icon="Phone" />{{ t('Llama al 105 (Policía)') }}</a>
    <a href="tel:100"><AppIcon :icon="Phone" />{{ t('Línea 100, gratuita las 24 horas') }}</a>
    <a href="https://chat100.warminan.gob.pe" target="_blank" rel="noopener"><AppIcon :icon="MessageCircle" />Chat 100</a>
  </div>
</template>
