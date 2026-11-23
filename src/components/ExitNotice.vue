<script setup>
import { ref } from 'vue';
import { t } from '../composables/useI18n.js';

// Aviso amarillo bajo la cabecera. Se oculta al pulsar «Entendido» (solo en esta visita).
const visible = ref(true);
</script>

<template>
  <div v-if="visible" class="tip">
    <!-- En celular se muestra la versión corta (ver public.css, max-width:560px). -->
    <p class="tip-long"><strong>{{ t('Salir rápido') }}</strong> {{ t('te lleva de inmediato a Google. Úsalo si alguien se acerca. También funciona presionando Esc tres veces.') }}</p>
    <p class="tip-short"><strong>{{ t('Salir rápido') }}</strong> {{ t('te lleva a Google si alguien se acerca.') }}</p>
    <button type="button" @click="visible = false">{{ t('Entendido') }}</button>
  </div>
</template>
