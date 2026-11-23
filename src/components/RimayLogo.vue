<script setup>
defineProps({ size: { type: Number, default: 38 } });
</script>

<template>
  <svg :width="size" :height="Math.round(size * 0.92)" viewBox="0 0 130 120" aria-hidden="true">
    <circle cx="64" cy="60" r="32" fill="#FFD95A" />
    <path d="M48 16.9 A46 46 0 0 0 48 103.1" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" />
    <path d="M99.2 30.4 A46 46 0 0 1 99.2 89.6" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
  </svg>
</template>
