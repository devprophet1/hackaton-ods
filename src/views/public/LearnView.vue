<script setup>
import { Eye, Scale, ShieldCheck, BookUser, HeartHandshake } from 'lucide-vue-next';
import { t } from '../../composables/useI18n.js';
import AppIcon from '../../components/AppIcon.vue';
import { openChat } from '../../composables/useUi.js';
import { useGo } from '../../composables/useGo.js';

const go = useGo();
const subnav = [['senales', 'Señales'], ['tipos', 'Tipos de violencia'], ['derechos', 'Tus derechos'], ['plan', 'Plan de seguridad'], ['ayudar', 'Cómo ayudar'], ['directorio', 'Directorio']];
const signs = [
  'Revisa tu celular o decide con quién hablas y a dónde vas.',
  'Te aleja de tu familia y amistades.',
  'Te humilla, insulta o ridiculiza, en privado o en público.',
  'Te amenaza con hacerte daño a ti, a tus hijos o a sí misma.',
  'Controla tu dinero o te impide trabajar o estudiar.',
  'Te presiona u obliga a tener relaciones sexuales.',
];
const types = [
  ['Física', 'Golpes, empujones o cualquier acción que dañe el cuerpo o la salud, incluido el descuido grave.'],
  ['Psicológica', 'Controlar, aislar, humillar o amenazar. Puede afectar la salud mental aunque no deje marcas.'],
  ['Sexual', 'Cualquier acto de naturaleza sexual sin consentimiento o bajo presión, aunque no haya contacto físico.'],
  ['Económica o patrimonial', 'Quitar o controlar el dinero, los bienes o los documentos, o impedir que trabajes.'],
];
const rights = [
  'Recibir orientación legal, psicológica y social gratuita en un Centro de Emergencia Mujer.',
  'Denunciar en cualquier comisaría o ante la Fiscalía. La denuncia puede ser verbal o escrita y no necesitas un abogado.',
  'Pedir medidas de protección, como que el agresor salga de la vivienda o no pueda acercarse a ti.',
  'Ser tratada con respeto y sin que te culpen por lo ocurrido.',
  'Que otra persona, como un familiar o un testigo, también pueda denunciar en tu favor.',
];
const plan = [
  'Guarda el 105 y la Línea 100 en tu celular con un nombre que no llame la atención.',
  'Piensa en un lugar seguro adonde ir y en cómo llegar.',
  'Acuerda una palabra clave con alguien de confianza para pedir ayuda sin que otros lo noten.',
  'Deja una copia de tus documentos, llaves y algo de dinero con alguien de confianza.',
  'Si hay niñas o niños, enséñales a pedir ayuda y a llamar al 105.',
  'Si alguien revisa tu celular, borra el historial del navegador después de usar Rimay.',
];
const help = [
  'Escúchala sin juzgar y créele.',
  'No la presiones para que deje la relación: respeta sus tiempos y decisiones.',
  'No enfrentes al agresor, porque puede aumentar el riesgo para ella.',
  'Compártele la Línea 100 y ofrécete a acompañarla al CEM o a la comisaría.',
  'Si ves una agresión en curso, llama al 105.',
];
// [servicio, para qué, contacto { href?, text }, horario]
const directory = [
  ['Policía Nacional', 'Emergencias y riesgo inmediato', { href: 'tel:105', text: 'Llamar al 105' }, '24 horas'],
  ['Línea 100 (MIMP)', 'Orientación gratuita y confidencial, en español, quechua y aimara', { href: 'tel:100', text: 'Llamar al 100' }, '24 horas, todos los días'],
  ['Chat 100', 'Orientación y acompañamiento por internet', { href: 'https://chat100.warminan.gob.pe', text: 'Abrir el Chat 100', ext: true }, '24 horas'],
  ['Centro de Emergencia Mujer', 'Atención legal, psicológica y social gratuita', { text: 'Presencial, en el CEM más cercano' }, 'Consulta tu CEM'],
  ['Central Única de Denuncias', 'Presentar una denuncia', { text: 'Canal oficial del Mininter' }, 'Consulta el canal'],
  ['SAMU', 'Emergencias médicas', { href: 'tel:106', text: 'Llamar al 106' }, '24 horas'],
];
const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
</script>

<template>
  <section>
    <div class="learn">
      <h2>{{ t('Infórmate') }}</h2>
      <p>{{ t('Información clara para reconocer la violencia, conocer tus derechos y saber a dónde acudir. Si algo de esto te pasa, no es tu culpa.') }}</p>
      <div class="subnav" :aria-label="t('Temas')">
        <button v-for="[id, label] in subnav" :key="id" type="button" @click="scrollTo(id)">{{ t(label) }}</button>
      </div>

      <section id="senales">
        <h3 class="sec-title"><AppIcon :icon="Eye" :size="24" />{{ t('Reconoce las señales') }}</h3>
        <p>{{ t('La violencia no siempre deja marcas visibles. Presta atención si la persona con quien vives o te relacionas:') }}</p>
        <ul class="list"><li v-for="s in signs" :key="s">{{ t(s) }}</li></ul>
        <p>{{ t('Si reconoces alguna de estas situaciones, puedes hablar con alguien hoy mismo.') }}</p>
        <div class="ctas"><button class="btn small" type="button" @click="openChat">{{ t('Hablar con el asistente') }}</button></div>
      </section>

      <section id="tipos">
        <h3 class="sec-title"><AppIcon :icon="Scale" :size="24" />{{ t('Tipos de violencia') }}</h3>
        <p>{{ t('La Ley N.º 30364 reconoce cuatro tipos de violencia contra las mujeres y los integrantes del grupo familiar.') }}</p>
        <div class="types">
          <div v-for="[name, text] in types" :key="name"><h4>{{ t(name) }}</h4><p>{{ t(text) }}</p></div>
        </div>
        <p class="source">{{ t('Fuente: Ley N.º 30364. Resumen en lenguaje sencillo.') }}</p>
      </section>

      <section id="derechos">
        <h3 class="sec-title"><AppIcon :icon="Scale" :size="24" />{{ t('Tus derechos') }}</h3>
        <ul class="list"><li v-for="r in rights" :key="r">{{ t(r) }}</li></ul>
        <p class="source">{{ t('Fuente: Ley N.º 30364. Confirma los detalles de tu caso con el CEM o la Línea 100.') }}</p>
      </section>

      <section id="plan">
        <h3 class="sec-title"><AppIcon :icon="ShieldCheck" :size="24" />{{ t('Plan de seguridad') }}</h3>
        <p>{{ t('Pequeños preparativos pueden ayudarte a actuar rápido si la situación empeora.') }}</p>
        <ul class="list"><li v-for="p in plan" :key="p">{{ t(p) }}</li></ul>
      </section>

      <section id="ayudar">
        <h3 class="sec-title"><AppIcon :icon="HeartHandshake" :size="24" />{{ t('Cómo ayudar a alguien') }}</h3>
        <p>{{ t('Si una amiga, vecina o familiar vive violencia, tu apoyo puede marcar la diferencia.') }}</p>
        <ul class="list"><li v-for="h in help" :key="h">{{ t(h) }}</li></ul>
        <div class="ctas"><button class="btn small outline" type="button" @click="go('/reportar')">{{ t('Reportar como testigo') }}</button></div>
      </section>

      <section id="directorio" style="border-bottom:0;">
        <h3 class="sec-title"><AppIcon :icon="BookUser" :size="24" />{{ t('Directorio de ayuda') }}</h3>
        <div class="dir-wrap">
          <table class="dir">
            <thead><tr><th>{{ t('Servicio') }}</th><th>{{ t('Para qué') }}</th><th>{{ t('Cómo contactar') }}</th><th>{{ t('Horario') }}</th></tr></thead>
            <tbody>
              <tr v-for="[name, what, c, hours] in directory" :key="name">
                <td>{{ t(name) }}</td>
                <td>{{ t(what) }}</td>
                <td>
                  <a v-if="c.href" :href="c.href" :target="c.ext ? '_blank' : undefined" :rel="c.ext ? 'noopener' : undefined">{{ t(c.text) }}</a>
                  <template v-else>{{ t(c.text) }}</template>
                </td>
                <td>{{ t(hours) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="source">{{ t('Verifica direcciones y horarios en los canales oficiales antes de acudir.') }}</p>
      </section>
    </div>
  </section>
</template>
