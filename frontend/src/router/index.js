import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import AdminBusinessesView from '@views/AdminBusinessesView.vue'
import BranchesView from '@views/BranchesView.vue'
import LoginView from '@views/LoginView.vue'
import CustomFieldsView from '@views/CustomFieldsView.vue'
import DashboardView from '@views/DashboardView.vue'
import RolesView from '@views/RolesView.vue'
import SettingsView from '@views/SettingsView.vue'
import UsersView from '@views/UsersView.vue'
import WarehousesView from '@views/WarehousesView.vue'

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
      path: '/admin/businesses',
      name: 'admin-businesses',
      component: AdminBusinessesView,
      meta: { requiresAuth: true, requiresSuperAdmin: true, requiredPermission: 'businesses.index' },
    },
    {
      path: '/business',
      redirect: { name: 'settings', query: { group: 'business' } },
    },
    {
      path: '/branches',
      name: 'branches',
      component: BranchesView,
      meta: { requiresAuth: true, requiredPermission: 'branches.index' },
    },
    {
      path: '/warehouses',
      name: 'warehouses',
      component: WarehousesView,
      meta: { requiresAuth: true, requiredPermission: 'warehouses.index' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true, requiredAnyPermissions: ['settings.index', 'businesses.index'] },
    },
    {
      path: '/custom-fields',
      name: 'custom-fields',
      component: CustomFieldsView,
      meta: { requiresAuth: true, requiredPermission: 'custom_fields.index' },
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: { requiresAuth: true, requiredPermission: 'users.index' },
    },
    {
      path: '/roles',
      name: 'roles',
      component: RolesView,
      meta: { requiresAuth: true, requiredPermission: 'roles.index' },
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

  if (to.meta.requiresSuperAdmin && !auth.isSuperAdmin) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiredPermission && !auth.can(to.meta.requiredPermission)) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiredAnyPermissions && !auth.canAny(to.meta.requiredAnyPermissions)) {
    return { name: 'dashboard' }
  }

  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
