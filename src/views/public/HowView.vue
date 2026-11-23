<script setup>
import { t } from '../../composables/useI18n.js';
import { openChat } from '../../composables/useUi.js';
import { useGo } from '../../composables/useGo.js';

const go = useGo();
const steps = [
  ['Te preguntamos si estás a salvo', 'Si hay peligro inmediato, te mostramos cómo llamar al 105 o a la Línea 100 antes que nada.'],
  ['Cuentas lo que pasó, a tu ritmo', 'Puedes hacerlo de forma anónima. Ningún campo es obligatorio y no pedimos tu DNI.'],
  ['Recibes orientación al instante', 'El asistente responde con información de la Ley N.º 30364 y de los canales oficiales, y te dice a dónde acudir.'],
  ['Si lo pides, una persona te contacta', 'Alguien capacitado de una institución aliada te escribe por el medio y en el horario que elegiste, y te acompaña hacia el CEM o la comisaría.'],
];
</script>

<template>
  <section>
    <div class="page">
      <h2>{{ t('Cómo funciona Rimay') }}</h2>
      <p>{{ t('Rimay te ayuda a dar el primer paso: contar lo que pasa, recibir orientación y llegar a la ayuda oficial. No reemplaza una denuncia ni la atención profesional.') }}</p>
      <ol class="steps3">
        <li v-for="([title, text], i) in steps" :key="i">
          <span class="n">{{ i + 1 }}</span>
          <div><h3>{{ t(title) }}</h3><p>{{ t(text) }}</p></div>
        </li>
      </ol>
      <div class="ctas">
        <button class="btn" type="button" @click="go('/reportar')">{{ t('Reportar un caso') }}</button>
        <button class="btn outline" type="button" @click="openChat">{{ t('Hablar con el asistente') }}</button>
      </div>
    </div>
  </section>
</template>
