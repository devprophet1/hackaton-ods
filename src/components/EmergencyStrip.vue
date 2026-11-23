<script setup>
import { Phone, MessageCircle } from 'lucide-vue-next';
import { t } from '../composables/useI18n.js';
import AppIcon from './AppIcon.vue';
import EmergencyLink from './EmergencyLink.vue';
</script>

<template>
  <div class="strip" role="region" :aria-label="t('Ayuda inmediata')">
    <span>{{ t('¿Estás en peligro ahora?') }}</span>
    <EmergencyLink to="105"><AppIcon :icon="Phone" />{{ t('Llama al 105 (Policía)') }}</EmergencyLink>
    <EmergencyLink to="100"><AppIcon :icon="Phone" />{{ t('Línea 100, gratuita las 24 horas') }}</EmergencyLink>
    <EmergencyLink to="chat"><AppIcon :icon="MessageCircle" />Chat 100</EmergencyLink>
  </div>
</template>
