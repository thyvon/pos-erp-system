<template>
  <AppLayout
    title="Products"
    subtitle="Manage sellable items, variable products, combo bundles, and product-specific pack sizes."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Catalog' },
      { label: 'Products' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <section class="overflow-hidden rounded-[5px] border border-slate-200/80 bg-white/75 shadow-[0_18px_45px_rgba(56,77,112,0.08)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
          @click="filtersExpanded = !filtersExpanded"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-sm font-semibold text-slate-950 dark:text-white">Filters</span>
              <span
                class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {{ activeFilterCount }} active
              </span>
            </div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Narrow the product list by type, stock mode, status, category, or brand.
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="activeFilterCount > 0"
              type="button"
              class="erp-button-secondary"
              @click.stop="resetFilters"
            >
              Clear
            </button>
            <span
              class="inline-flex h-10 w-10 items-center justify-center rounded-[5px] border border-slate-200/80 bg-white/80 text-slate-500 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300"
            >
              <i class="fa-solid fa-chevron-down transition" :class="filtersExpanded ? 'rotate-180' : ''"></i>
            </span>
          </div>
        </button>

        <div v-if="filtersExpanded" class="border-t border-slate-200/70 px-4 py-4 dark:border-slate-800/80">
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
        </div>
      </section>

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
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.sku || 'Auto-generated SKU' }}
              <span v-if="row.barcode"> · {{ row.barcode }}</span>
            </div>
          </div>
        </template>

        <template #type="{ row }">
          <div class="space-y-1">
            <span class="inline-flex rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
              {{ formatType(row.type) }}
            </span>
            <div class="text-xs text-slate-500 dark:text-slate-400">
              <template v-if="row.type === 'variable'">
                {{ row.variations_count }} variation{{ row.variations_count === 1 ? '' : 's' }}
              </template>
              <template v-else-if="row.type === 'combo'">
                {{ row.combo_items_count }} component{{ row.combo_items_count === 1 ? '' : 's' }}
              </template>
              <template v-else>
                {{ row.packagings_count }} pack size{{ row.packagings_count === 1 ? '' : 's' }}
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
              <div>Sell: {{ formatVariantPriceRange(row.variations, 'selling_price') }}</div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Buy: {{ formatVariantPriceRange(row.variations, 'purchase_price') }}
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
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
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
const showActionsColumn = computed(() => canEditProduct.value || canDeleteProduct.value)

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

const formatVariantPriceRange = (variations, field) => {
  const prices = (variations || [])
    .map((variation) => Number.parseFloat(variation?.[field] ?? 0))
    .filter((value) => Number.isFinite(value))

  if (!prices.length) {
    return 'By variants'
  }

  const min = Math.min(...prices)
  const max = Math.max(...prices)

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

const formatStockTracking = (type) => ({
  none: 'None',
  lot: 'Lot',
  serial: 'Serial',
}[type] || type)

const stockTrackingClass = (type) => {
  if (type === 'serial') return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300'
  if (type === 'lot') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

const openCreatePage = () => {
  if (!canCreateProduct.value) return
  router.push({ name: 'product-create' })
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
