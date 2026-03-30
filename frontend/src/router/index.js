import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@stores/auth'

const AdminBusinessesView = () => import('@views/AdminBusinessesView.vue')
const BrandsView = () => import('@views/BrandsView.vue')
const BranchesView = () => import('@views/BranchesView.vue')
const LoginView = () => import('@views/LoginView.vue')
const ForgotPasswordView = () => import('@views/ForgotPasswordView.vue')
const ResetPasswordView = () => import('@views/ResetPasswordView.vue')
const NoBranchAccessView = () => import('@views/NoBranchAccessView.vue')
const CustomFieldsView = () => import('@views/CustomFieldsView.vue')
const CategoriesView = () => import('@views/CategoriesView.vue')
const CustomerGroupsView = () => import('@views/CustomerGroupsView.vue')
const CustomersView = () => import('@views/CustomersView.vue')
const DashboardView = () => import('@views/DashboardView.vue')
const InventoryAdjustmentsView = () => import('@views/InventoryAdjustmentsView.vue')
const InventoryCountsView = () => import('@views/InventoryCountsView.vue')
const InventoryLotsView = () => import('@views/InventoryLotsView.vue')
const InventorySerialsView = () => import('@views/InventorySerialsView.vue')
const InventoryTransfersView = () => import('@views/InventoryTransfersView.vue')
const PriceGroupsView = () => import('@views/PriceGroupsView.vue')
const ProductFormView = () => import('@views/ProductFormView.vue')
const ProductDetailView = () => import('@views/ProductDetailView.vue')
const ProductsView = () => import('@views/ProductsView.vue')
const RolesView = () => import('@views/RolesView.vue')
const SettingsView = () => import('@views/SettingsView.vue')
const SuppliersView = () => import('@views/SuppliersView.vue')
const TaxGroupsView = () => import('@views/TaxGroupsView.vue')
const TaxRatesView = () => import('@views/TaxRatesView.vue')
const UnitsView = () => import('@views/UnitsView.vue')
const UsersView = () => import('@views/UsersView.vue')
const VariationTemplatesView = () => import('@views/VariationTemplatesView.vue')
const RackLocationsView = () => import('@views/RackLocationsView.vue')
const WarehousesView = () => import('@views/WarehousesView.vue')

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
      meta: { guestOnly: true, allowWithoutBranches: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: { guestOnly: true, allowWithoutBranches: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      /** Allow token reset whether or not a session exists (email link flows). */
      meta: { allowWithoutBranches: true },
    },
    {
      path: '/no-branch-access',
      name: 'no-branch-access',
      component: NoBranchAccessView,
      meta: { requiresAuth: true, allowWithoutBranches: true },
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
      path: '/inventory/adjustments',
      name: 'inventory-adjustments',
      component: InventoryAdjustmentsView,
      meta: { requiresAuth: true, requiredPermission: 'inventory.index' },
    },
    {
      path: '/inventory/transfers',
      name: 'inventory-transfers',
      component: InventoryTransfersView,
      meta: { requiresAuth: true, requiredPermission: 'inventory.index' },
    },
    {
      path: '/inventory/counts',
      name: 'inventory-counts',
      component: InventoryCountsView,
      meta: { requiresAuth: true, requiredPermission: 'inventory.index' },
    },
    {
      path: '/inventory/lots',
      name: 'inventory-lots',
      component: InventoryLotsView,
      meta: { requiresAuth: true, requiredPermission: 'inventory.index' },
    },
    {
      path: '/inventory/serials',
      name: 'inventory-serials',
      component: InventorySerialsView,
      meta: { requiresAuth: true, requiredPermission: 'inventory.index' },
    },
    {
      path: '/custom-fields',
      name: 'custom-fields',
      component: CustomFieldsView,
      meta: { requiresAuth: true, requiredPermission: 'custom_fields.index' },
    },
    {
      path: '/tax-rates',
      name: 'tax-rates',
      component: TaxRatesView,
      meta: { requiresAuth: true, requiredPermission: 'tax_rates.index' },
    },
    {
      path: '/tax-groups',
      name: 'tax-groups',
      component: TaxGroupsView,
      meta: { requiresAuth: true, requiredPermission: 'tax_groups.index' },
    },
    {
      path: '/customer-groups',
      name: 'customer-groups',
      component: CustomerGroupsView,
      meta: { requiresAuth: true, requiredPermission: 'customer_groups.index' },
    },
    {
      path: '/customers',
      name: 'customers',
      component: CustomersView,
      meta: { requiresAuth: true, requiredPermission: 'customers.index' },
    },
    {
      path: '/suppliers',
      name: 'suppliers',
      component: SuppliersView,
      meta: { requiresAuth: true, requiredPermission: 'suppliers.index' },
    },
    {
      path: '/catalog/products',
      name: 'products',
      component: ProductsView,
      meta: { requiresAuth: true, requiredPermission: 'products.index' },
    },
    {
      path: '/catalog/products/create',
      name: 'product-create',
      component: ProductFormView,
      meta: { requiresAuth: true, requiredPermission: 'products.create' },
    },
    {
      path: '/catalog/products/:id',
      name: 'product-detail',
      component: ProductDetailView,
      meta: { requiresAuth: true, requiredPermission: 'products.index' },
    },
    {
      path: '/catalog/products/:id/edit',
      name: 'product-edit',
      component: ProductFormView,
      meta: { requiresAuth: true, requiredPermission: 'products.edit' },
    },
    {
      path: '/catalog/categories',
      name: 'categories',
      component: CategoriesView,
      meta: { requiresAuth: true, requiredPermission: 'categories.index' },
    },
    {
      path: '/catalog/brands',
      name: 'brands',
      component: BrandsView,
      meta: { requiresAuth: true, requiredPermission: 'brands.index' },
    },
    {
      path: '/catalog/units',
      name: 'units',
      component: UnitsView,
      meta: { requiresAuth: true, requiredPermission: 'units.index' },
    },
    {
      path: '/catalog/variation-templates',
      name: 'variation-templates',
      component: VariationTemplatesView,
      meta: { requiresAuth: true, requiredPermission: 'variation_templates.index' },
    },
    {
      path: '/catalog/rack-locations',
      name: 'rack-locations',
      component: RackLocationsView,
      meta: { requiresAuth: true, requiredPermission: 'rack_locations.index' },
    },
    {
      path: '/catalog/price-groups',
      name: 'price-groups',
      component: PriceGroupsView,
      meta: { requiresAuth: true, requiredPermission: 'price_groups.index' },
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

  if (
    auth.isLoggedIn &&
    auth.user &&
    to.meta.requiresAuth &&
    !to.meta.allowWithoutBranches &&
    auth.needsBranchAccessBlock
  ) {
    return { name: 'no-branch-access' }
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
    if (auth.needsBranchAccessBlock) {
      return { name: 'no-branch-access' }
    }

    return { name: 'dashboard' }
  }

  return true
})

export default router
