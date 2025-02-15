import { createRouter, createWebHistory } from 'vue-router'
import generatedRoutes from '~pages'
import { setupLayouts } from 'virtual:generated-layouts'

export const DEFAULT_HOME_URL = '/'

const router = createRouter({
  history: createWebHistory(),
  routes: setupLayouts(
    generatedRoutes.concat([
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/pages/not-found.vue'),
      },
    ])
  ),
})

export default router
