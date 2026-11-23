<script setup>
import { ref, computed } from 'vue';
import { useI18n } from '../composables/useI18n.js';

const { lang, t } = useI18n();
// Aviso amarillo bajo la cabecera. Se oculta al pulsar «Entendido» (solo en esta visita).
const visible = ref(true);
// En español la frase sigue al nombre del botón («Salir rápido te lleva…»); en quechua y aimara
// la traducción es una oración propia, así que se separa con dos puntos.
const sep = computed(() => (lang.value === 'es' ? ' ' : ': '));
</script>

<template>
  <div v-if="visible" class="tip">
    <!-- En celular se muestra la versión corta (ver public.css, max-width:560px). -->
    <p class="tip-long"><strong>{{ t('Salir rápido') }}</strong>{{ sep }}{{ t('te lleva de inmediato a Google. Úsalo si alguien se acerca. También funciona presionando Esc tres veces.') }}</p>
    <p class="tip-short"><strong>{{ t('Salir rápido') }}</strong>{{ sep }}{{ t('te lleva a Google si alguien se acerca.') }}</p>
    <button type="button" @click="visible = false">{{ t('Entendido') }}</button>
  </div>
</template>
