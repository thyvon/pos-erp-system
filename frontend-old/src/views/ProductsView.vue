<template>
  <AppLayout
    title="Products"
    subtitle="Manage sellable items, variable products, combo bundles, and product conversion factors."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Catalog' },
      { label: 'Products' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <FilterPanel
        v-model:expanded="filtersExpanded"
        title="Filters"
        description="Narrow the product list by type, stock mode, status, category, or brand."
        :active-count="activeFilterCount"
        :show-clear="activeFilterCount > 0"
        @clear="resetFilters"
      >
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label class="erp-label">Product type</label>
            <AppSelect
              :model-value="store.filters.type || null"
              :options="typeFilterOptions"
              clearable
              placeholder="All types"
              @update:model-value="handleTypeFilter($event)"
            />
          </div>
          <div>
            <label class="erp-label">Stock mode</label>
            <AppSelect
              :model-value="store.filters.stock_tracking || null"
              :options="stockTrackingFilterOptions"
              clearable
              placeholder="All stock modes"
              @update:model-value="handleStockTrackingFilter($event)"
            />
          </div>
          <div>
            <label class="erp-label">Status</label>
            <AppSelect
              :model-value="store.filters.is_active === '' ? null : store.filters.is_active"
              :options="statusFilterOptions"
              clearable
              placeholder="Any status"
              @update:model-value="handleStatusFilter($event)"
            />
          </div>
          <div>
            <label class="erp-label">Category</label>
            <AppSelect
              :model-value="store.filters.category_id || null"
              :options="categoryOptions"
              clearable
              searchable
              placeholder="All categories"
              search-placeholder="Search categories"
              @update:model-value="handleCategoryFilter($event)"
            />
          </div>
          <div>
            <label class="erp-label">Brand</label>
            <AppSelect
              :model-value="store.filters.brand_id || null"
              :options="brandOptions"
              clearable
              searchable
              placeholder="All brands"
              search-placeholder="Search brands"
              @update:model-value="handleBrandFilter($event)"
            />
          </div>
        </div>
      </FilterPanel>

      <DataTable
        title="Products"
        :columns="columns"
        :rows="store.items"
        :loading="store.loading"
        :total="store.pagination.total"
        :current-page="store.pagination.current_page"
        :last-page="store.pagination.last_page"
        :per-page="store.pagination.per_page"
        :search-term="store.filters.search"
        @search="handleSearch"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #toolbar>
          <button v-if="canCreateProduct" type="button" class="erp-button-primary" @click="openCreatePage">
            <i class="fa-solid fa-plus"></i>
            New product
          </button>
        </template>

        <template #product="{ row }">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 overflow-hidden rounded-[6px] bg-slate-100 dark:bg-slate-800">
              <img
                v-if="row.image_url"
                :src="row.image_url"
                :alt="row.name"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                N/A
              </div>
            </div>
            <div>
              <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ row.sku || 'Auto-generated SKU' }}
              </div>
            </div>
          </div>
        </template>

        <template #type="{ row }">
          <div class="space-y-1">
            <span class="erp-badge erp-badge-info">
              {{ formatType(row.type) }}
            </span>
            <div class="text-xs text-slate-500 dark:text-slate-400">
              <template v-if="row.type === 'variable'">
                {{ row.variations_count }} variation{{ row.variations_count === 1 ? '' : 's' }}
              </template>
              <template v-else-if="row.type === 'combo'">
                {{ row.combo_items_count }} component{{ row.combo_items_count === 1 ? '' : 's' }}
              </template>
              <template v-else-if="row.type === 'service'">
                Service item
              </template>
              <template v-else>
                Factor x{{ formatConversionFactor(row.conversion_factor) }}
              </template>
            </div>
          </div>
        </template>

        <template #category="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            <div>{{ row.category?.name || 'No category' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.brand?.name || 'No brand' }}</div>
          </div>
        </template>

        <template #pricing="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <template v-if="row.type === 'variable'">
              <div>Sell: {{ formatVariantPriceRange(row, 'selling') }}</div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Buy: {{ formatVariantPriceRange(row, 'purchase') }}
              </div>
            </template>
            <template v-else>
              <div>Sell: {{ formatMoney(row.selling_price) }}</div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Buy: {{ formatMoney(row.purchase_price) }}
              </div>
            </template>
          </div>
        </template>

        <template #stock="{ row }">
          <div class="space-y-1">
            <span
              class="erp-badge"
              :class="stockTrackingClass(row.stock_tracking)"
            >
              {{ formatStockTracking(row.stock_tracking) }}
            </span>
            <div class="text-xs text-slate-500 dark:text-slate-400">
              {{ row.track_inventory ? 'Inventory tracked' : 'No inventory tracking' }}
            </div>
          </div>
        </template>

        <template #status="{ row }">
          <StatusBadge :status="row.is_active ? 'active' : 'inactive'" :label="row.is_active ? 'Active' : 'Inactive'" />
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canViewProduct" type="button" class="erp-button-icon" @click="openDetailPage(row)">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button v-if="canEditProduct" type="button" class="erp-button-icon" @click="openEditPage(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteProduct" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <ConfirmDelete
        :show="deleteDialog.show"
        :item-name="deleteDialog.itemName"
        :loading="store.deleting"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAlert from '@components/ui/AppAlert.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import StatusBadge from '@components/ui/StatusBadge.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useProductsStore } from '@stores/products'

const auth = useAuthStore()
const store = useProductsStore()
const route = useRoute()
const router = useRouter()

const canCreateProduct = computed(() => auth.can('products.create'))
const canEditProduct = computed(() => auth.can('products.edit'))
const canDeleteProduct = computed(() => auth.can('products.delete'))
const canViewProduct = computed(() => auth.can('products.index'))
const showActionsColumn = computed(() => canViewProduct.value || canEditProduct.value || canDeleteProduct.value)

const columns = computed(() => {
  const base = [
    { key: 'product', label: 'Product' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category / Brand' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'stock', label: 'Stock mode' },
    { key: 'status', label: 'Status' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const deleteDialog = reactive({ show: false, product: null, itemName: '' })
const filtersExpanded = ref(false)

const typeFilterOptions = [
  { value: 'single', label: 'Single' },
  { value: 'variable', label: 'Variable' },
  { value: 'service', label: 'Service' },
  { value: 'combo', label: 'Combo' },
]

const stockTrackingFilterOptions = [
  { value: 'none', label: 'None' },
  { value: 'lot', label: 'Lot' },
  { value: 'serial', label: 'Serial' },
]

const statusFilterOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

const categoryOptions = computed(() =>
  (store.formOptions.categories || []).map((category) => ({
    value: category.id,
    label: category.parent?.name ? `${category.parent.name} / ${category.name}` : category.name,
    description: category.parent?.name || '',
  }))
)

const brandOptions = computed(() =>
  (store.formOptions.brands || []).map((brand) => ({
    value: brand.id,
    label: brand.name,
  }))
)

const activeFilterCount = computed(() =>
  [
    store.filters.type,
    store.filters.stock_tracking,
    store.filters.is_active,
    store.filters.category_id,
    store.filters.brand_id,
  ].filter((value) => value !== '' && value !== null && value !== undefined).length
)

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => {
    alert.show = true
  })
}

const formatMoney = (value) => {
  const amount = Number.parseFloat(value ?? 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount)
}

const formatVariantPriceRange = (product, field) => {
  const min = Number.parseFloat(product?.[`variable_${field}_price_min`] ?? '')
  const max = Number.parseFloat(product?.[`variable_${field}_price_max`] ?? '')

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return 'By variants'
  }

  if (min === max) {
    return formatMoney(min)
  }

  return `${formatMoney(min)} - ${formatMoney(max)}`
}

const formatType = (type) => ({
  single: 'Single',
  variable: 'Variable',
  service: 'Service',
  combo: 'Combo',
}[type] || type)

const formatConversionFactor = (value) => {
  const numeric = Number(value ?? 1)

  if (!Number.isFinite(numeric)) {
    return '1'
  }

  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(4).replace(/\.?0+$/, '')
}

const formatStockTracking = (type) => ({
  none: 'None',
  lot: 'Lot',
  serial: 'Serial',
}[type] || type)

const stockTrackingClass = (type) => {
  if (type === 'serial') return 'erp-badge-info'
  if (type === 'lot') return 'erp-badge-warning'
  return 'erp-badge-neutral'
}

const openCreatePage = () => {
  if (!canCreateProduct.value) return
  router.push({ name: 'product-create' })
}

const openDetailPage = (product) => {
  if (!canViewProduct.value) return
  router.push({ name: 'product-detail', params: { id: product.id } })
}

const openEditPage = (product) => {
  if (!canEditProduct.value) return
  router.push({ name: 'product-edit', params: { id: product.id } })
}

const openDeleteModal = (product) => {
  if (!canDeleteProduct.value) return
  deleteDialog.show = true
  deleteDialog.product = product
  deleteDialog.itemName = product.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.product = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchProducts({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchProducts({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchProducts({ per_page: perPage, page: 1 })
}

const handleTypeFilter = async (value) => {
  await store.fetchProducts({ type: value || '', page: 1 })
}

const handleStockTrackingFilter = async (value) => {
  await store.fetchProducts({ stock_tracking: value || '', page: 1 })
}

const handleStatusFilter = async (value) => {
  await store.fetchProducts({ is_active: value ?? '', page: 1 })
}

const handleCategoryFilter = async (value) => {
  await store.fetchProducts({ category_id: value || '', page: 1 })
}

const handleBrandFilter = async (value) => {
  await store.fetchProducts({ brand_id: value || '', page: 1 })
}

const resetFilters = async () => {
  await store.fetchProducts({
    type: '',
    stock_tracking: '',
    is_active: '',
    category_id: '',
    brand_id: '',
    page: 1,
  })
}

const confirmDelete = async () => {
  if (!deleteDialog.product) return

  try {
    await store.deleteProduct(deleteDialog.product.id)
    showToast('success', 'Product deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the product.')
  }
}

const consumeNotice = async () => {
  const notice = typeof route.query.notice === 'string' ? route.query.notice : ''

  if (!notice) {
    return
  }

  if (notice === 'created') {
    showToast('success', 'Product created successfully.')
  } else if (notice === 'updated') {
    showToast('success', 'Product updated successfully.')
  }

  const query = { ...route.query }
  delete query.notice
  await router.replace({ query })
}

onMounted(async () => {
  await Promise.all([
    store.fetchProducts(),
    store.fetchFormOptions(),
  ])

  await consumeNotice()
})
</script>
