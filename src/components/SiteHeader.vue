<script setup>
import { useRoute } from 'vue-router';
import { t } from '../composables/useI18n.js';
import { menuOpen, openMenu } from '../composables/useUi.js';
import { useGo } from '../composables/useGo.js';
import RimayLogo from './RimayLogo.vue';
import QuickExitButton from './QuickExitButton.vue';
import ExitNotice from './ExitNotice.vue';

const route = useRoute();
const go = useGo();
const links = [
  ['/', 'Inicio'],
  ['/como-funciona', 'Cómo funciona'],
  ['/informate', 'Infórmate'],
  ['/reportar', 'Reportar'],
  ['/preguntas', 'Preguntas'],
];
</script>

<template>
  <header class="top">
    <div class="bar">
      <button class="logo" type="button" :aria-label="t('Inicio')" @click="go('/')">
        <RimayLogo />
        <span class="name">Rimay</span>
      </button>
      <nav class="links" :aria-label="t('Secciones')">
        <button v-for="[path, label] in links" :key="path" type="button" :class="{ on: route.path === path }" @click="go(path)">
          {{ t(label) }}
        </button>
      </nav>
      <div class="tools">
        <button class="menu-btn" type="button" :aria-expanded="menuOpen" aria-controls="drawer" @click="openMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          <span>{{ t('Menú') }}</span>
        </button>
        <QuickExitButton />
      </div>
    </div>
    <ExitNotice />
  </header>
</template>
