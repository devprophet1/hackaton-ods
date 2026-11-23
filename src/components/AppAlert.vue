<script setup>
// Alerta de la maqueta: roja (danger) o amarilla (warn).
import { TriangleAlert, Info } from 'lucide-vue-next';
import AppIcon from './AppIcon.vue';

defineProps({
  title: { type: String, required: true },
  variant: { type: String, default: 'danger' },
});
</script>

<template>
  <div class="alert" :class="{ warn: variant === 'warn' }" role="alert">
    <h3 class="alert-title"><AppIcon :icon="variant === 'warn' ? Info : TriangleAlert" :size="20" />{{ title }}</h3>
    <p><slot /></p>
    <div v-if="$slots.actions" class="ctas"><slot name="actions" /></div>
  </div>
</template>
