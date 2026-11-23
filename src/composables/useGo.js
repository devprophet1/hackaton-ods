import { useRouter, useRoute } from 'vue-router';

// Navegación de la web pública. Con ancla, si ya estamos en esa ruta, solo desplaza.
export function useGo() {
  const router = useRouter();
  const route = useRoute();
  return (path, anchor) => {
    const hash = anchor ? '#' + anchor : '';
    if (route.path === path && route.hash === hash) {
      if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    router.push({ path, hash });
  };
}
