<script setup>
import { computed } from 'vue';
import { t } from '../composables/useI18n.js';
import { EMERGENCY } from '../composables/emergencyInfo.js';

// Enlace a un canal de emergencia (105, 100, 106, 113 o el Chat 100) con tooltip que indica a qué
// entidad pertenece. El tooltip aparece al pasar el mouse o con el foco del teclado; los lectores de
// pantalla lo leen como parte del enlace (texto oculto). El href y el texto visible no cambian.
const props = defineProps({
  to: { type: String, required: true },          // '105' | '100' | '106' | '113' | 'chat'
  pos: { type: String, default: 'bottom' },      // 'bottom' | 'top' (top dentro del chat)
});
const info = computed(() => EMERGENCY[props.to]);
const tip = computed(() => t(info.value.tip));
</script>

<template>
  <a :href="info.href" class="has-tip" :data-tip="tip" :data-tip-pos="pos"
    :target="info.external ? '_blank' : null" :rel="info.external ? 'noopener' : null"><slot /><span class="sr-only"> ({{ tip }})</span></a>
</template>
