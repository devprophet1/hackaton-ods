<script setup>
// Tarjeta «¿Qué necesitas ahora?». Con href es un enlace (por ejemplo tel:); si no, un botón.
import AppIcon from './AppIcon.vue';

defineProps({
  icon: { type: [Object, Function], default: null },
  title: { type: String, required: true },
  text: { type: String, default: '' },
  go: { type: String, default: '' },
  href: { type: String, default: '' },
  danger: { type: Boolean, default: false },
  tip: { type: String, default: '' }, // tooltip: a qué entidad pertenece el número
});
defineEmits(['select']);
</script>

<template>
  <a v-if="href" class="need-card" :class="{ danger, 'has-tip': tip }" :href="href" :data-tip="tip || null">
    <AppIcon v-if="icon" :icon="icon" :size="24" class="card-ico" />
    <strong>{{ title }}</strong><span>{{ text }}</span><span class="go">{{ go }}</span><span v-if="tip" class="sr-only"> ({{ tip }})</span>
  </a>
  <button v-else class="need-card" :class="{ danger }" type="button" @click="$emit('select')">
    <AppIcon v-if="icon" :icon="icon" :size="24" class="card-ico" />
    <strong>{{ title }}</strong><span>{{ text }}</span><span class="go">{{ go }}</span>
  </button>
</template>
