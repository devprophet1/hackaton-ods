import { reactive } from 'vue';

// Borrador del reporte SOLO en memoria: sobrevive a cambiar de ruta dentro de la app,
// nunca se guarda en localStorage ni sessionStorage y se borra al enviar.
const empty = () => ({
  device: '', danger: '', anon: true,
  alias: '', medio: 'sms', numero: '', horario: '', direccion: '',
  types: [], place: '', description: '', support: [],
});

export const draft = reactive(empty());

export function resetDraft() {
  Object.assign(draft, empty());
}
