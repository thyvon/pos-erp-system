import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import LoginView from '@views/LoginView.vue'
import DashboardView from '@views/DashboardView.vue'
import UsersView from '@views/UsersView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.isLoggedIn && !auth.user && to.path !== '/login') {
    try {
      await auth.fetchMe()
    } catch {
      auth.clearAuth()
    }
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
