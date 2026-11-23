<script setup>
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { t } from '../composables/useI18n.js';
import { menuOpen, closeMenu, openChat, bigText, setSize } from '../composables/useUi.js';
import { useGo } from '../composables/useGo.js';
import LangSwitch from './LangSwitch.vue';

const go = useGo();
const router = useRouter();
const nav = ref(null);

watch(menuOpen, async (open) => {
  if (open) { await nextTick(); nav.value?.querySelector('button')?.focus(); }
});

function menuGo(path, anchor) {
  closeMenu();
  go(path, anchor);
}
function chat() {
  closeMenu();
  openChat();
}
function panel() {
  closeMenu();
  router.push('/admin/login');
}
</script>

<template>
  <div class="scrim" :class="{ open: menuOpen }" @click="closeMenu"></div>
  <aside id="drawer" class="drawer" :class="{ open: menuOpen }" :aria-label="t('Menú')" :aria-hidden="!menuOpen">
    <div class="drawer-head">
      <strong>{{ t('Menú') }}</strong>
      <button type="button" :aria-label="t('Cerrar menú')" @click="closeMenu">×</button>
    </div>
    <nav ref="nav">
      <button type="button" @click="menuGo('/')">{{ t('Inicio') }}</button>
      <button type="button" @click="menuGo('/como-funciona')">{{ t('Cómo funciona') }}<small>{{ t('De tu reporte a la ayuda, paso a paso') }}</small></button>
      <button type="button" @click="menuGo('/reportar')">{{ t('Reportar un caso') }}<small>{{ t('Anónimo o con contacto seguro') }}</small></button>
      <button type="button" @click="chat">{{ t('Hablar con el asistente') }}<small>{{ t('Orientación psicológica y legal') }}</small></button>
      <button type="button" @click="menuGo('/informate')">{{ t('Infórmate') }}<small>{{ t('Señales, derechos y plan de seguridad') }}</small></button>
      <button type="button" @click="menuGo('/informate', 'ayudar')">{{ t('Cómo ayudar a alguien') }}<small>{{ t('Si alguien cercano vive violencia') }}</small></button>
      <button type="button" @click="menuGo('/preguntas')">{{ t('Preguntas frecuentes') }}<small>{{ t('Privacidad, anonimato y seguridad') }}</small></button>
      <button type="button" @click="menuGo('/nosotros')">{{ t('Nosotros') }}<small>{{ t('Quiénes somos y por qué Rimay') }}</small></button>
      <button type="button" @click="menuGo('/', 'canales')">{{ t('Canales oficiales de ayuda') }}</button>
    </nav>
    <h4>{{ t('Accesibilidad') }}</h4>
    <div class="setting">
      <span>{{ t('Tamaño de texto') }}</span>
      <div class="seg">
        <button type="button" :aria-pressed="!bigText" @click="setSize(false)">{{ t('Normal') }}</button>
        <button type="button" :aria-pressed="bigText" @click="setSize(true)">{{ t('Grande') }}</button>
      </div>
    </div>
    <div class="setting"><span>{{ t('Idioma') }}</span><LangSwitch /></div>
    <p class="staff-link">{{ t('¿Trabajas en una institución aliada?') }} <button type="button" @click="panel">{{ t('Ingresar al panel') }}</button></p>
  </aside>
</template>
