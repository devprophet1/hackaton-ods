<script setup>
// Tarjeta «¿Qué necesitas ahora?». Con href es un enlace (por ejemplo tel:); si no, un botón.
defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  go: { type: String, default: '' },
  href: { type: String, default: '' },
  danger: { type: Boolean, default: false },
});
defineEmits(['select']);
</script>

<template>
  <a v-if="href" class="need-card" :class="{ danger }" :href="href">
    <strong>{{ title }}</strong><span>{{ text }}</span><span class="go">{{ go }}</span>
  </a>
  <button v-else class="need-card" :class="{ danger }" type="button" @click="$emit('select')">
    <strong>{{ title }}</strong><span>{{ text }}</span><span class="go">{{ go }}</span>
  </button>
</template>
