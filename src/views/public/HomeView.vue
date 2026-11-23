<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n, LANG_NAME } from '../../composables/useI18n.js';
import { openChat } from '../../composables/useUi.js';
import { useGo } from '../../composables/useGo.js';
import LangSwitch from '../../components/LangSwitch.vue';
import AppCard from '../../components/AppCard.vue';

const { lang, t } = useI18n();
const go = useGo();
const router = useRouter();
const langNote = computed(() => (lang.value === 'es' ? '' : t('La Línea 100 te atiende en [IDIOMA], gratis y las 24 horas.', { IDIOMA: LANG_NAME[lang.value] })));
const topics = [
  ['senales', 'Reconoce las señales', 'La violencia no siempre deja marcas.'],
  ['tipos', 'Tipos de violencia', 'Lo que reconoce la Ley N.º 30364.'],
  ['derechos', 'Tus derechos', 'Atención gratuita y medidas de protección.'],
  ['plan', 'Plan de seguridad', 'Pasos simples para estar más protegida.'],
  ['directorio', 'Directorio de ayuda', 'A quién llamar y para qué.'],
];
</script>

<template>
  <section>
    <div class="hero">
      <div>
        <LangSwitch class="hero-lang" />
        <p class="hello">{{ t('Hola. Este es un espacio seguro y confidencial.') }}</p>
        <div v-if="langNote" class="lang-note">{{ langNote }}<a href="tel:100">{{ t('Llamar al 100') }}</a></div>
        <p v-if="lang !== 'es'" class="prelim">Traducción preliminar, pendiente de validar con hablantes nativos.</p>
        <h1>{{ t('Una voz segura para quien vive violencia en Villa El Salvador') }}</h1>
        <p class="lede">{{ t('Reporta un caso sin dar tu nombre y recibe orientación psicológica y legal inmediata. Si lo deseas, una persona del equipo de apoyo te contactará de forma segura.') }}</p>
        <div class="ctas">
          <button class="btn" type="button" @click="go('/reportar')">{{ t('Reportar un caso') }}</button>
          <button class="btn outline" type="button" @click="openChat">{{ t('Hablar con el asistente') }}</button>
        </div>
      </div>
      <div class="art" aria-hidden="true">
        <svg viewBox="0 0 520 480">
          <defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.7" class="ink" /></pattern></defs>
          <circle cx="330" cy="225" r="178" class="y" />
          <circle cx="478" cy="58" r="26" class="y" />
          <path d="M58 140 A72 72 0 0 1 202 140 Z" class="y" />
          <path d="M132 162 A40 40 0 0 0 212 162 Z" class="y" />
          <path d="M92 200 A238 238 0 0 0 330 450" class="arc" />
          <rect x="310" y="110" width="182" height="160" fill="url(#dots)" />
          <text x="300" y="440" text-anchor="middle" font-family="Lora, Georgia, serif" font-weight="700" font-size="420" class="ink">R</text>
        </svg>
      </div>
      <aside class="side">
        <span class="kicker">{{ t('Ayuda ahora') }}</span>
        <p class="small">{{ t('Gratuita, las 24 horas') }}</p>
        <h3>{{ t('Línea 100') }}</h3>
        <p style="font-size:.9rem;">{{ t('Orientación gratuita y confidencial del Ministerio de la Mujer, en español, quechua y aimara.') }}</p>
        <div style="display:flex; flex-wrap:wrap; gap:18px;">
          <a href="tel:100">{{ t('Llamar') }}</a>
          <a href="https://chat100.warminan.gob.pe" target="_blank" rel="noopener">{{ t('Escribir al Chat 100') }}</a>
        </div>
      </aside>
    </div>

    <section class="need" aria-labelledby="needTitle">
      <h2 id="needTitle">{{ t('¿Qué necesitas ahora?') }}</h2>
      <div class="need-grid">
        <AppCard danger href="tel:105" :title="t('Estoy en peligro ahora')" :text="t('Llama a la Policía. No necesitas llenar nada antes.')" :go="t('Llamar al 105')" />
        <AppCard :title="t('Quiero contar lo que pasa')" :text="t('Anónimo y a tu ritmo, en tres pasos.')" :go="t('Reportar un caso')" @select="go('/reportar')" />
        <AppCard :title="t('Tengo dudas sobre qué hacer')" :text="t('El asistente te orienta al instante, sin registrarte.')" :go="t('Abrir el asistente')" @select="openChat" />
        <AppCard :title="t('Quiero ayudar a alguien')" :text="t('Qué decir y qué evitar si alguien cercano vive violencia.')" :go="t('Ver la guía')" @select="go('/informate', 'ayudar')" />
      </div>
    </section>

    <section class="learn-home" aria-labelledby="learnTitle">
      <h2 id="learnTitle">{{ t('Infórmate') }}</h2>
      <div class="topic-grid">
        <button v-for="[id, title, text] in topics" :key="id" class="topic" type="button" @click="go('/informate', id)">
          <strong>{{ t(title) }}</strong><span>{{ t(text) }}</span>
        </button>
      </div>
    </section>

    <section id="canales" class="channels">
      <h2>{{ t('Canales oficiales') }}</h2>
      <div class="channel-row">
        <div>{{ t('Línea 100') }}<small>MIMP</small></div>
        <div><a href="https://chat100.warminan.gob.pe" target="_blank" rel="noopener" style="text-decoration:none;">Chat 100</a><small>{{ t('Atención en línea') }}</small></div>
        <div>{{ t('Centro de Emergencia Mujer') }}<small>{{ t('Atención presencial') }}</small></div>
        <div>{{ t('Central Única de Denuncias') }}<small>Mininter</small></div>
        <div>{{ t('Policía 105') }}<small>{{ t('Emergencias') }}</small></div>
      </div>
    </section>

    <div class="foot">
      <span>{{ t('Rimay significa «hablar» en quechua. Demostración para el HackODS UA 2026 con datos ficticios.') }}</span>
      <button type="button" @click="router.push('/admin/login')">{{ t('Acceso para aliados') }}</button>
    </div>
  </section>
</template>
