<template>
  <AppLayout
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :breadcrumbs="breadcrumbs"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <LoadingSpinner
        :show="loading"
        title="Loading product"
        message="Fetching product details from the catalog."
      />

      <div
        v-if="loadError"
        class="rounded-[5px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
      >
        <div class="font-semibold">Unable to load the product.</div>
        <div class="mt-1">{{ loadError }}</div>
      </div>

      <div v-else-if="!loading && product" class="space-y-6">
        <section class="erp-form-section">
          <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold text-slate-950 dark:text-white">{{ product.name }}</h1>
              <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">SKU: {{ product.sku || 'Auto-generated SKU' }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="erp-button-secondary" @click="goBack">
                <i class="fa-solid fa-arrow-left"></i>
                Back to products
              </button>
              <button v-if="canEditProduct" type="button" class="erp-button-primary" @click="editProduct">
                <i class="fa-solid fa-pen-to-square"></i>
                Edit product
              </button>
            </div>
          </div>

          <div class="space-y-4">
              <div class="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] items-start">
                <div class="space-y-4">
                  <div class="rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
                    <div class="grid gap-4 sm:grid-cols-2">
                      <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Type</div>
                        <div class="text-sm text-slate-900 dark:text-white">{{ formatType(product.type) }}</div>
                      </div>
                      <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Status</div>
                        <div class="text-sm text-slate-900 dark:text-white">{{ product.is_active ? 'Active' : 'Inactive' }}</div>
                      </div>
                      <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Category</div>
                        <div class="text-sm text-slate-900 dark:text-white">{{ product.category?.name || 'No category' }}</div>
                      </div>
                      <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Brand</div>
                        <div class="text-sm text-slate-900 dark:text-white">{{ product.brand?.name || 'No brand' }}</div>
                      </div>
                      <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Unit</div>
                        <div class="text-sm text-slate-900 dark:text-white">{{ product.unit?.name || 'No unit' }}</div>
                      </div>
                      <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sub unit</div>
                        <div class="text-sm text-slate-900 dark:text-white">{{ product.sub_unit?.name || 'None' }}</div>
                      </div>
                      <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tax profile</div>
                        <div class="text-sm text-slate-900 dark:text-white">{{ product.tax_type || 'None' }}</div>
                      </div>
                      <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tax rate</div>
                        <div class="text-sm text-slate-900 dark:text-white">{{ product.tax_rate?.name || 'None' }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
                    <div class="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Pricing</div>
                        <div class="mt-3 space-y-3 text-sm text-slate-900 dark:text-white">
                          <div class="flex items-center justify-between gap-3">
                            <span>Sell price</span>
                            <span class="font-semibold">{{ priceLabel('selling') }}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span>Purchase price</span>
                            <span class="font-semibold">{{ priceLabel('purchase') }}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span>Sub sell price</span>
                            <span class="font-semibold">{{ formatMoney(product.sub_unit_selling_price) || 'N/A' }}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span>Sub purchase price</span>
                            <span class="font-semibold">{{ formatMoney(product.sub_unit_purchase_price) || 'N/A' }}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Inventory</div>
                        <div class="mt-3 space-y-3 text-sm text-slate-900 dark:text-white">
                          <div class="flex items-center justify-between gap-3">
                            <span>Tracks inventory</span>
                            <span class="font-semibold">{{ product.track_inventory ? 'Yes' : 'No' }}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span>Reorder alert</span>
                            <span class="font-semibold">{{ product.alert_quantity || 'None' }}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span>Max stock</span>
                            <span class="font-semibold">{{ product.max_stock_level || 'None' }}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span>Expiry tracking</span>
                            <span class="font-semibold">{{ product.has_expiry ? 'Enabled' : 'Disabled' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
                    <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Description & Details</div>
                    <div class="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
                      <div class="text-sm leading-6 text-slate-700 dark:text-slate-300">
                        <template v-if="product.description">
                          <p v-html="product.description"></p>
                        </template>
                        <template v-else>
                          <p class="text-slate-500 dark:text-slate-400">No description provided.</p>
                        </template>
                      </div>
                      <div class="space-y-3 text-sm text-slate-900 dark:text-white">
                        <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                          <span>Barcode type</span>
                          <span class="font-semibold">{{ product.barcode_type || 'N/A' }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                          <span>Price group</span>
                          <span class="font-semibold">{{ product.price_group?.name || 'Default' }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                          <span>Weight</span>
                          <span class="font-semibold">{{ product.weight || 'N/A' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <aside class="space-y-4 self-start xl:self-start">
                  <div v-if="product.image_url" class="min-h-[400px] rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
                    <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Product image</div>
                    <img :src="product.image_url" alt="Product image" class="mt-3 h-full w-full rounded-[10px] object-cover" />
                  </div>
                </aside>
              </div>
            </div>
        </section>

        <section v-if="product.variations?.length" class="erp-form-section">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-950 dark:text-white">Variations</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">View generated product variants and pricing.</p>
            </div>
          </div>
          <div class="overflow-x-auto rounded-[5px] border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
            <table class="erp-table min-w-full">
              <thead>
                <tr>
                  <th class="text-left">Variation</th>
                  <th class="text-left">SKU</th>
                  <th class="text-left">Sell</th>
                  <th class="text-left">Buy</th>
                  <th class="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="variation in product.variations" :key="variation.id" class="odd:bg-slate-50/80 dark:odd:bg-slate-900/50">
                  <td>{{ variation.name }}</td>
                  <td>{{ variation.sku || 'Auto-generated' }}</td>
                  <td>{{ formatMoney(variation.selling_price) }}</td>
                  <td>{{ formatMoney(variation.purchase_price) }}</td>
                  <td>{{ variation.is_active ? 'Active' : 'Inactive' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="product.combo_items?.length" class="erp-form-section">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-950 dark:text-white">Combo components</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Items included in this combo product.</p>
            </div>
          </div>
          <div class="overflow-x-auto rounded-[5px] border border-slate-200/80 dark:border-slate-800/80">
            <div class="min-w-[640px]">
              <div class="grid gap-3 border-b border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0.8fr)]">
                <div>Component</div>
                <div>Variation</div>
                <div>Qty</div>
              </div>
              <div v-for="item in product.combo_items" :key="item.id" class="grid gap-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-200 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0.8fr)] border-b border-slate-200/80 last:border-b-0 dark:border-slate-800/80">
                <div>{{ item.child_product?.name || 'Unknown product' }}</div>
                <div>{{ item.child_variation?.name || 'Base product' }}</div>
                <div>{{ item.quantity || '0' }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAlert from '@components/ui/AppAlert.vue'
import AppLayout from '@layouts/AppLayout.vue'
import LoadingSpinner from '@components/ui/LoadingSpinner.vue'
import { useAuthStore } from '@stores/auth'
import { useProductsStore } from '@stores/products'

const auth = useAuthStore()
const store = useProductsStore()
const route = useRoute()
const router = useRouter()

const product = ref(null)
const loading = ref(true)
const loadError = ref('')
const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })

const canEditProduct = computed(() => auth.can('products.edit'))
const pageTitle = computed(() => (product.value ? product.value.name : 'Product detail'))
const pageSubtitle = computed(() => 'View product information, pricing, variations, and inventory settings.')
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Catalog' },
  { label: 'Products', to: '/catalog/products' },
  { label: product.value ? product.value.name : 'Product detail' },
])

const formatMoney = (value) => {
  const amount = Number.parseFloat(value ?? 0)
  return Number.isNaN(amount)
    ? 'N/A'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
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

const priceLabel = (field) => {
  if (product.value?.type === 'variable') {
    const min = Number.parseFloat(product.value[`variable_${field}_price_min`] ?? '')
    const max = Number.parseFloat(product.value[`variable_${field}_price_max`] ?? '')

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return 'By variants'
    }

    if (min === max) {
      return formatMoney(min)
    }

    return `${formatMoney(min)} - ${formatMoney(max)}`
  }

  return formatMoney(product.value?.[`${field}_price`])
}

const loadProduct = async () => {
  loading.value = true
  loadError.value = ''

  try {
    product.value = await store.fetchProduct(route.params.id)
  } catch (error) {
    loadError.value = error.response?.data?.message || 'Unable to load this product.'
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push({ name: 'products' })
const editProduct = () => {
  if (!product.value) return
  router.push({ name: 'product-edit', params: { id: product.value.id } })
}

onMounted(loadProduct)
</script>
