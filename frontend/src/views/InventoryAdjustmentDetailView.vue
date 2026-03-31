<template>
  <AppLayout :title="pageTitle" :subtitle="pageSubtitle" :breadcrumbs="breadcrumbs">
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <LoadingSpinner
        :show="loading"
        title="Loading adjustment"
        message="Fetching stock adjustment details from inventory."
      />

      <div
        v-if="loadError"
        class="rounded-[5px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
      >
        <div class="font-semibold">Unable to load the stock adjustment.</div>
        <div class="mt-1">{{ loadError }}</div>
      </div>

      <div v-else-if="!loading && adjustment" class="space-y-6">
        <section class="erp-form-section">
          <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold text-slate-950 dark:text-white">{{ adjustment.reference_no }}</h1>
              <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Recorded on {{ formatDate(adjustment.date) }} for {{ adjustment.warehouse?.name || 'Unknown warehouse' }}
              </p>
            </div>
            <button type="button" class="erp-button-secondary" @click="goBack">
              <i class="fa-solid fa-arrow-left"></i>
              Back to adjustments
            </button>
          </div>

          <div class="space-y-4">
            <div class="rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
              <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reference</div>
                  <div class="text-sm text-slate-900 dark:text-white">{{ adjustment.reference_no }}</div>
                </div>
                <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Date</div>
                  <div class="text-sm text-slate-900 dark:text-white">{{ formatDate(adjustment.date) }}</div>
                </div>
                <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Warehouse</div>
                  <div class="text-sm text-slate-900 dark:text-white">{{ adjustment.warehouse?.name || 'Unknown warehouse' }}</div>
                </div>
                <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Branch</div>
                  <div class="text-sm text-slate-900 dark:text-white">{{ adjustment.warehouse?.branch_name || 'No branch' }}</div>
                </div>
                <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Created by</div>
                  <div class="text-sm text-slate-900 dark:text-white">{{ adjustment.creator?.name || 'System' }}</div>
                </div>
                <div class="flex items-center justify-between gap-3 rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Lines</div>
                  <div class="text-sm text-slate-900 dark:text-white">{{ adjustment.items?.length || 0 }}</div>
                </div>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div class="rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reason & Notes</div>
                <div class="mt-4 space-y-4">
                  <div>
                    <div class="text-sm font-semibold text-slate-950 dark:text-white">Reason</div>
                    <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ adjustment.reason || 'Manual stock adjustment' }}</div>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-950 dark:text-white">Notes</div>
                    <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ adjustment.notes || 'No notes provided.' }}</div>
                  </div>
                </div>
              </div>

              <div class="rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Summary</div>
                <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 text-sm text-slate-900 dark:text-white">
                  <div class="flex items-center justify-between gap-3">
                    <span>Total in lines</span>
                    <span class="font-semibold">{{ totals.inLines }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span>Total out lines</span>
                    <span class="font-semibold">{{ totals.outLines }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span>Total in qty</span>
                    <span class="font-semibold text-emerald-700 dark:text-emerald-300">{{ formatQuantity(totals.inQty) }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span>Total out qty</span>
                    <span class="font-semibold text-rose-700 dark:text-rose-300">{{ formatQuantity(totals.outQty) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="erp-form-section">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-slate-950 dark:text-white">Adjustment lines</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Review each posted inventory line for this adjustment.</p>
          </div>

          <div class="overflow-x-auto rounded-[5px] border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
            <table class="erp-table min-w-full">
              <thead>
                <tr>
                  <th class="text-left">Product</th>
                  <th class="text-left">Direction</th>
                  <th class="text-left">Quantity</th>
                  <th class="text-left">Unit cost</th>
                  <th class="text-left">Lot</th>
                  <th class="text-left">Serial</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in adjustment.items" :key="item.id" class="odd:bg-slate-50/80 dark:odd:bg-slate-900/50">
                  <td>
                    <div class="font-semibold text-slate-950 dark:text-white">
                      {{ item.product?.name || 'Unknown product' }}
                      <span v-if="item.variation?.name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation.name }}</span>
                    </div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {{ item.variation?.sku || item.product?.sku || 'No SKU' }}
                    </div>
                  </td>
                  <td>
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="item.direction === 'in'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'"
                    >
                      {{ item.direction === 'in' ? 'In' : 'Out' }}
                    </span>
                  </td>
                  <td>{{ formatQuantity(item.quantity) }}</td>
                  <td>{{ formatMoney(item.unit_cost) }}</td>
                  <td>{{ item.lot?.lot_number || '-' }}</td>
                  <td>{{ item.serial?.serial_number || '-' }}</td>
                </tr>
              </tbody>
            </table>
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
import LoadingSpinner from '@components/ui/LoadingSpinner.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useInventoryAdjustmentsStore } from '@stores/inventory'

const route = useRoute()
const router = useRouter()
const store = useInventoryAdjustmentsStore()

const adjustment = ref(null)
const loading = ref(true)
const loadError = ref('')
const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })

const pageTitle = computed(() => adjustment.value ? adjustment.value.reference_no : 'Stock adjustment')
const pageSubtitle = computed(() => 'Review posted stock adjustment details and item lines.')
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Inventory' },
  { label: 'Adjustments', to: '/inventory/adjustments' },
  { label: adjustment.value ? adjustment.value.reference_no : 'Preview' },
])

const totals = computed(() => {
  const items = adjustment.value?.items || []

  return items.reduce((summary, item) => {
    const quantity = Number(item.quantity || 0)

    if (item.direction === 'in') {
      summary.inLines += 1
      summary.inQty += quantity
    } else {
      summary.outLines += 1
      summary.outQty += quantity
    }

    return summary
  }, {
    inLines: 0,
    outLines: 0,
    inQty: 0,
    outQty: 0,
  })
})

const formatDate = (value) => {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString()
}

const formatQuantity = (value) => Number(value || 0).toFixed(4)

const formatMoney = (value) => {
  const amount = Number.parseFloat(value ?? 0)
  return Number.isNaN(amount)
    ? 'N/A'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount)
}

const goBack = () => {
  router.push({ name: 'inventory-adjustments' })
}

const loadAdjustment = async () => {
  loading.value = true
  loadError.value = ''

  try {
    adjustment.value = await store.fetchItem(route.params.id)
  } catch (error) {
    loadError.value = error.response?.data?.message || 'Unable to load this stock adjustment.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAdjustment()
})
</script>
