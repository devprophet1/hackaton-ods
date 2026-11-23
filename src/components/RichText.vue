<script setup>
import { computed } from 'vue';
import { t } from '../composables/useI18n.js';
import { EMERGENCY } from '../composables/emergencyInfo.js';

// Texto del asistente con enlaces seguros: URLs https y los números 105, 100, 106 y 113 se vuelven enlaces.
// No usa v-html: cada parte se interpola con {{ }} y los enlaces se arman como elementos <a>.
const props = defineProps({ text: { type: String, default: '' } });
const RE = /(https:\/\/[^\s<>«»"]+[^\s<>«»".,;:!?)])|\b(105|100|106|113)\b/g;

const parts = computed(() => {
  const out = [];
  let last = 0;
  for (const m of props.text.matchAll(RE)) {
    if (m.index > last) out.push({ text: props.text.slice(last, m.index) });
    if (m[1]) out.push({ text: m[1], href: m[1], external: true, tip: m[1].includes('chat100.warminan.gob.pe') ? t(EMERGENCY.chat.tip) : '' });
    else out.push({ text: m[2], href: `tel:${m[2]}`, tip: t(EMERGENCY[m[2]].tip) });
    last = m.index + m[0].length;
  }
  if (last < props.text.length) out.push({ text: props.text.slice(last) });
  return out;
});
</script>

<template>
  <template v-for="(p, i) in parts" :key="i">
    <a v-if="p.href" :href="p.href" :target="p.external ? '_blank' : null" :rel="p.external ? 'noopener' : null"
      :class="{ 'has-tip': p.tip }" :data-tip="p.tip || null" data-tip-pos="top">{{ p.text }}<span v-if="p.tip" class="sr-only"> ({{ p.tip }})</span></a>
    <template v-else>{{ p.text }}</template>
  </template>
</template>
