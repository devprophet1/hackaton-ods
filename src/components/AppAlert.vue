<script setup>
// Alerta de la maqueta: roja (danger) o amarilla (warn).
defineProps({
  title: { type: String, required: true },
  variant: { type: String, default: 'danger' },
});
</script>

<template>
  <div class="alert" :class="{ warn: variant === 'warn' }" role="alert">
    <h3>{{ title }}</h3>
    <p><slot /></p>
    <div v-if="$slots.actions" class="ctas"><slot name="actions" /></div>
  </div>
</template>
