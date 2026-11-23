<script setup>
import { useI18n } from '../composables/useI18n.js';

const { lang, t, setLang } = useI18n();
const options = [['es', 'Español'], ['qu', 'Quechua'], ['ay', 'Aimara']];
</script>

<template>
  <div class="seg" role="group" :aria-label="t('Idioma')">
    <button v-for="[code, label] in options" :key="code" type="button" :aria-pressed="lang === code" @click="setLang(code)">
      {{ label }}
    </button>
  </div>
</template>
