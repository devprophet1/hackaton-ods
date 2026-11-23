import { ref } from 'vue';

// Estado compartido de la web pública: menú lateral, asistente y tamaño de texto.
export const menuOpen = ref(false);
export const chatOpen = ref(false);

export const openMenu = () => { menuOpen.value = true; };
export const closeMenu = () => { menuOpen.value = false; };
export const openChat = () => { chatOpen.value = true; };
export const toggleChat = () => { chatOpen.value = !chatOpen.value; };

function readSize() {
  try { return localStorage.getItem('rimay.size') === 'big'; } catch { return false; }
}
export const bigText = ref(readSize());
document.documentElement.classList.toggle('big', bigText.value);

export function setSize(big) {
  bigText.value = big;
  document.documentElement.classList.toggle('big', big);
  // Solo la preferencia de tamaño de texto se guarda en el navegador.
  try { localStorage.setItem('rimay.size', big ? 'big' : 'normal'); } catch { /* sin almacenamiento */ }
}
