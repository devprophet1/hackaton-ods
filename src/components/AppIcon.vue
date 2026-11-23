<script setup>
// Ícono de línea de lucide-vue-next con estilo uniforme: trazo 1.75 y color heredado (currentColor).
// Es decorativo (aria-hidden): siempre acompaña a un texto o a un botón con aria-label.
defineProps({
  icon: { type: [Object, Function], required: true },
  size: { type: Number, default: 18 },
});
</script>

<template>
  <component :is="icon" class="ico" :size="size" :stroke-width="1.75" aria-hidden="true" focusable="false" />
</template>

<style>
.ico{ flex:none; display:inline-block; vertical-align:-0.2em; }
</style>
