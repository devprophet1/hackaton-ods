import { ref } from 'vue';

// Etiquetas y utilidades del panel.
export const TYPE_LABEL = { fisica: 'Física', psicologica: 'Psicológica', sexual: 'Sexual', economica: 'Económica o patrimonial', no_se: 'No sé identificarla' };
export const SUPPORT_LABEL = { psico: 'Psicológico', legal: 'Legal', medico: 'Médico', info: 'Información general' };
export const METHOD_LABEL = { sms: 'Mensaje de texto', whatsapp: 'WhatsApp', llamada: 'Llamada' };
export const STATUS_OPTIONS = [
  ['pendiente', 'Pendiente'], ['contactado', 'Contactado'], ['derivado_cem', 'Derivado al CEM'],
  ['derivado_comisaria', 'Derivado a comisaría'], ['cerrado', 'Cerrado'],
];
// Insignia corta como en la maqueta: 0 Pendiente, 1 Contactado, 2 Derivado, 3 Cerrado.
export const statusBadge = (s) => {
  const i = { pendiente: 0, contactado: 1, derivado_cem: 2, derivado_comisaria: 2, cerrado: 3 }[s] ?? 0;
  return { cls: 'badge st-' + i, label: ['Pendiente', 'Contactado', 'Derivado', 'Cerrado'][i] };
};

export const fmt = (t) => new Date(t).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const ago = (t) => {
  const h = Math.round((Date.now() - new Date(t)) / 3600000);
  return h < 1 ? 'hace menos de 1 hora' : h === 1 ? 'hace 1 hora' : `hace ${h} horas`;
};
export const labels = (arr, map) => (arr || []).map((x) => map[x] || x).join(', ') || 'No indicado';

// Contador de casos con riesgo pendientes (menú lateral).
export const riskPending = ref(0);
