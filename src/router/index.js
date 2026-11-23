import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '../layouts/PublicLayout.vue';
import HomeView from '../views/public/HomeView.vue';
import HowView from '../views/public/HowView.vue';
import LearnView from '../views/public/LearnView.vue';
import ReportView from '../views/public/ReportView.vue';
import FaqView from '../views/public/FaqView.vue';
import AboutView from '../views/public/AboutView.vue';
import { isLoggedIn, setOnExpired } from '../composables/useAuth.js';

const routes = [
  {
    path: '/',
    component: PublicLayout,
    meta: { title: 'Consultas' },
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'como-funciona', name: 'how', component: HowView },
      { path: 'informate', name: 'learn', component: LearnView },
      { path: 'reportar', name: 'report', component: ReportView },
      { path: 'preguntas', name: 'faq', component: FaqView },
      { path: 'nosotros', name: 'about', component: AboutView },
    ],
  },
  // Panel: lazy loading para que la web pública no descargue su código.
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { title: 'Rimay — Panel de aliados' },
    children: [
      { path: '', redirect: '/admin/casos' },
      { path: 'login', name: 'admin-login', component: () => import('../views/admin/LoginView.vue') },
      { path: 'casos', name: 'admin-cases', component: () => import('../views/admin/CasesView.vue'), meta: { auth: true } },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/DashboardView.vue'), meta: { auth: true } },
      { path: 'conocimiento', name: 'admin-kb', component: () => import('../views/admin/KnowledgeView.vue'), meta: { auth: true } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return new Promise((resolve) => setTimeout(() => resolve({ el: to.hash, behavior: 'smooth' }), 60));
    return { top: 0, behavior: 'smooth' };
  },
});

router.beforeEach((to) => {
  if (to.meta.auth && !isLoggedIn.value) return { name: 'admin-login' };
  if (to.name === 'admin-login' && isLoggedIn.value) return { name: 'admin-cases' };
});

router.afterEach((to) => {
  document.title = to.meta.title || 'Consultas';
});

setOnExpired(() => router.push({ name: 'admin-login' }));
