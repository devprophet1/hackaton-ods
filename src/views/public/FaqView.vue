<script setup>
import { t } from '../../composables/useI18n.js';

const faqs = [
  ['¿Mi reporte es anónimo?', 'Sí, por defecto. Solo si desactivas la opción anónima te pedimos un nombre o seudónimo y un medio de contacto. Nunca pedimos tu DNI.'],
  ['¿Quién puede ver mi reporte?', 'Solo el personal autorizado de una institución aliada, y solo si dejaste datos de contacto. Los reportes anónimos se usan únicamente como estadísticas del distrito.'],
  ['¿Esto es una denuncia oficial?', 'No. Rimay te orienta y te conecta con la ayuda. Para denunciar, acude a una comisaría o a la Central Única de Denuncias; el asistente te explica cómo hacerlo.'],
  ['¿Para qué sirve el botón Salir rápido?', 'Te lleva de inmediato a Google y reemplaza esta página en el historial, para que el botón «atrás» no regrese a Rimay. No borra el historial completo del navegador: si usas un dispositivo compartido, te recomendamos abrir Rimay en una ventana privada.'],
  ['¿El asistente es una persona?', 'No. Es un asistente automático que da orientación general basada en fuentes oficiales. Para hablar con una persona, llama a la Línea 100 o pide que te contactemos.'],
  ['¿Qué hago si estoy en peligro ahora?', 'Llama al 105 (Policía) o a la Línea 100, gratuita las 24 horas. No necesitas completar ningún formulario antes.'],
];
</script>

<template>
  <section>
    <div class="page">
      <h2>{{ t('Preguntas frecuentes') }}</h2>
      <details v-for="([q, a], i) in faqs" :key="i" class="faq" :open="i === 0">
        <summary>{{ t(q) }}</summary>
        <p>{{ t(a) }}</p>
      </details>
    </div>
  </section>
</template>
