<script setup>
import { ref } from 'vue';
import { t } from '../composables/useI18n.js';

// Aviso amarillo bajo la cabecera. Se oculta al pulsar «Entendido» (solo en esta visita).
const visible = ref(true);
</script>

<template>
  <div v-if="visible" class="tip">
    <p><strong>{{ t('Salir rápido') }}</strong> {{ t('te lleva de inmediato a Google. Úsalo si alguien se acerca. También funciona presionando Esc tres veces.') }}</p>
    <button type="button" @click="visible = false">{{ t('Entendido') }}</button>
  </div>
</template>
