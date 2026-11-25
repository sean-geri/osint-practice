import { createRouter, createWebHistory } from 'vue-router'
import DomainPage from '@/pages/DomainPage.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/domains' },
    { path: '/domains', name: 'domains', component: DomainPage },
  ],
})
