<script setup>
import { t } from '../../composables/useI18n.js';

const values = [
  ['Seguridad primero', 'Cada pantalla está pensada para no exponer a quien la usa.'],
  ['Privacidad', 'Pedimos lo mínimo y separamos la identidad del relato.'],
  ['Acompañamiento humano', 'La tecnología orienta; las personas acompañan.'],
];
const words = [
  ['Rimay', 'Quechua', 'Hablar'],
  ['Yanapay', 'Quechua', 'Ayudar'],
  ['Warmi', 'Quechua', 'Mujer'],
  ['Allillanchu', 'Quechua', 'Saludo: ¿estás bien?'],
  ['Kamisaraki', 'Aimara', 'Hola'],
  ['Yuspagara', 'Aimara', 'Gracias'],
  ['Arsuña / Parlaña', 'Aimara', 'Hablar'],
];
</script>

<template>
  <section>
    <div class="page">
      <h2>{{ t('Nosotros') }}</h2>
      <p>{{ t('Rimay significa «hablar» en quechua. Nace en el HackODS UA 2026 para aportar al ODS 5, igualdad de género, con una idea simple: nadie debería quedarse en silencio por no saber a quién acudir o por no sentirse a salvo para hacerlo.') }}</p>
      <div class="values">
        <div v-for="[title, text] in values" :key="title"><h3>{{ t(title) }}</h3><p>{{ t(text) }}</p></div>
      </div>
      <h3>{{ t('El equipo') }}</h3>
      <p>[Nombre del equipo]: [Integrante 1], [Integrante 2], [Integrante 3].</p>
      <h3>{{ t('Aliados') }}</h3>
      <p>{{ t('Buscamos trabajar con el Centro de Emergencia Mujer, la Municipalidad de Villa El Salvador y organizaciones locales para atender los casos que llegan a Rimay.') }}</p>
      <h3>{{ t('Palabras en quechua y aimara') }}</h3>
      <p>{{ t('La Línea 100 atiende en español, quechua y aimara. Estas son algunas palabras que usamos en Rimay.') }}</p>
      <div class="dir-wrap">
        <table class="dir">
          <thead><tr><th>{{ t('Palabra') }}</th><th>{{ t('Lengua') }}</th><th>{{ t('Significado en español') }}</th></tr></thead>
          <tbody>
            <tr v-for="[w, l, m] in words" :key="w"><td>{{ w }}</td><td>{{ l }}</td><td>{{ m }}</td></tr>
          </tbody>
        </table>
      </div>
      <p class="source">{{ t('Fuentes: Diccionario funcional quechua-castellano (Clodoaldo Soto Ruiz), materiales de Quechua Tinkuy (Universidad de Texas) y vocabularios de Aymara Uta. La escritura puede variar según la región; validar con hablantes nativos.') }}</p>
    </div>
  </section>
</template>
