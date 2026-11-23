// A qué entidad y área pertenece cada canal de emergencia (tooltips de los enlaces tel: y del Chat 100).
// Solo datos verificados de la sección 12 del spec. Los textos pasan por t() para quechua y aimara.
export const EMERGENCY = {
  105: { href: 'tel:105', tip: 'Policía Nacional del Perú (PNP): emergencias y riesgo inmediato.' },
  100: { href: 'tel:100', tip: 'Línea 100 del Ministerio de la Mujer (MIMP): orientación gratuita y confidencial ante la violencia, las 24 horas, en español, quechua y aimara.' },
  106: { href: 'tel:106', tip: 'SAMU (Servicio de Atención Móvil de Urgencia): emergencias médicas.' },
  113: { href: 'tel:113', tip: 'Línea 113 Salud del Ministerio de Salud (Minsa), opción 5: salud mental y psicología, gratuita, las 24 horas.' },
  chat: { href: 'https://chat100.warminan.gob.pe', tip: 'Chat 100 del Ministerio de la Mujer (MIMP): orientación por escrito, gratuita y confidencial.', external: true },
};
