<template>
  <AppLayout :title="pageTitle" :subtitle="pageSubtitle" :breadcrumbs="breadcrumbs">
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <LoadingSpinner
        :show="loading"
        title="Loading transfer"
        message="Fetching stock transfer details for review."
      />

      <div
        v-if="loadError"
        class="rounded-[5px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
      >
        <div class="font-semibold">Unable to load the stock transfer.</div>
        <div class="mt-1">{{ loadError }}</div>
      </div>

      <div v-else-if="!loading && transfer" class="space-y-6">
        <section class="erp-form-section">
          <div class="mb-6 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-2xl font-semibold text-slate-950 dark:text-white">{{ transfer.reference_no }}</h1>
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                  :class="statusClasses(transfer.status)"
                >
                  {{ statusLabel(transfer.status) }}
                </span>
              </div>
              <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {{ transfer.status === 'pending'
                  ? 'Pending means the transfer is on the way but not yet received. Source stock is reserved, and the sender or admin can still correct or delete it until the receiver confirms.'
                  : 'Review the transfer first, then confirm receipt only when the destination team agrees the lines are correct.' }}
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-start gap-2 sm:flex-nowrap sm:justify-end">
              <button type="button" class="erp-button-secondary whitespace-nowrap" @click="goBack">
                <i class="fa-solid fa-arrow-left"></i>
                Back to transfers
              </button>
              <button
                v-if="canEdit"
                type="button"
                class="erp-button-secondary whitespace-nowrap"
                @click="openEditPage"
              >
                <i class="fa-solid fa-pen-to-square"></i>
                Edit transfer
              </button>
              <button
                v-if="canReceive"
                type="button"
                class="erp-button-primary whitespace-nowrap"
                :disabled="store.receivingId === transfer.id"
                @click="receiveTransfer"
              >
                <span
                  v-if="store.receivingId === transfer.id"
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                ></span>
                <i v-else class="fa-solid fa-box-open"></i>
                Confirm receipt
              </button>
            </div>
          </div>

          <div class="grid gap-4 xl:grid-cols-2">
            <div class="rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
              <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Transfer overview</div>
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <div class="rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Date</div>
                  <div class="mt-1 text-sm text-slate-900 dark:text-white">{{ formatDate(transfer.date) }}</div>
                </div>
                <div class="rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Lines</div>
                  <div class="mt-1 text-sm text-slate-900 dark:text-white">{{ transfer.items?.length || 0 }}</div>
                </div>
                <div class="rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">From warehouse</div>
                  <div class="mt-1 text-sm text-slate-900 dark:text-white">{{ transfer.from_warehouse?.name || 'Unknown warehouse' }}</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ transfer.from_warehouse?.branch_name || 'No branch' }}</div>
                </div>
                <div class="rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">To warehouse</div>
                  <div class="mt-1 text-sm text-slate-900 dark:text-white">{{ transfer.to_warehouse?.name || 'Unknown warehouse' }}</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ transfer.to_warehouse?.branch_name || 'No branch' }}</div>
                </div>
              </div>
            </div>

            <div class="rounded-[5px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
              <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Agreement trail</div>
              <div class="mt-4 grid gap-4">
                <div class="rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sender recorded</div>
                  <div class="mt-1 text-sm text-slate-900 dark:text-white">{{ transfer.sender?.name || 'Pending sender record' }}</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ transfer.sent_at ? formatDateTime(transfer.sent_at) : 'Not recorded yet' }}</div>
                </div>
                <div class="rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Receiver confirmed</div>
                  <div class="mt-1 text-sm text-slate-900 dark:text-white">{{ transfer.receiver?.name || 'Pending destination confirmation' }}</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {{ transfer.received_at ? formatDateTime(transfer.received_at) : 'Not received yet' }}
                  </div>
                </div>
                <div class="rounded-md bg-slate-50/80 p-3 dark:bg-slate-900/80">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Notes</div>
                  <div class="mt-1 text-sm text-slate-900 dark:text-white">{{ transfer.notes || 'No notes provided.' }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="erp-form-section">
          <div class="erp-table-shell">
            <div class="erp-table-header">
              <div>
                <h2 class="text-lg font-semibold text-slate-950 dark:text-white">Transfer lines</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ filteredTransferItems.length }} of {{ transfer.items?.length || 0 }} lines
                </p>
              </div>

              <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div class="w-full sm:w-72">
                  <SearchInput v-model="lineSearch" placeholder="Search transfer lines" />
                </div>
              </div>
            </div>

            <div
              v-if="filteredTransferItems.length === 0"
              class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              No transfer lines match "{{ lineSearch }}".
            </div>

            <div v-else class="overflow-x-auto">
              <table class="erp-table min-w-full">
                <thead>
                  <tr>
                    <th class="text-left">Product</th>
                    <th class="text-left">Quantity</th>
                    <th class="text-left">Unit cost</th>
                    <th class="text-left">Lot</th>
                    <th class="text-left">Serial</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in filteredTransferItems" :key="item.id" class="odd:bg-slate-50/80 dark:odd:bg-slate-900/50">
                    <td>
                      <div class="font-semibold text-slate-950 dark:text-white">
                        {{ item.product?.name || 'Unknown product' }}
                        <span v-if="item.variation?.name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation.name }}</span>
                      </div>
                      <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {{ item.variation?.sku || item.product?.sku || 'No SKU' }}
                      </div>
                    </td>
                    <td>{{ formatQuantity(item.quantity) }}</td>
                    <td>{{ formatMoney(item.unit_cost) }}</td>
                    <td>{{ item.lot?.lot_number || '-' }}</td>
                    <td>{{ item.serial?.serial_number || '-' }}</td>
                  </tr>
                </tbody>
              </table>
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
import LoadingSpinner from '@components/ui/LoadingSpinner.vue'
import SearchInput from '@components/ui/SearchInput.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useInventoryOptionsStore, useInventoryTransfersStore } from '@stores/inventory'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useInventoryTransfersStore()
const optionsStore = useInventoryOptionsStore()

const transfer = ref(null)
const loading = ref(true)
const loadError = ref('')
const lineSearch = ref('')
const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })

const pageTitle = computed(() => transfer.value ? transfer.value.reference_no : 'Stock transfer')
const pageSubtitle = computed(() => 'Review the transfer document and confirm receipt from the destination side.')
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Inventory' },
  { label: 'Transfers', to: '/inventory/transfers' },
  { label: transfer.value ? transfer.value.reference_no : 'Preview' },
])

const hasBranchAccess = (branchId) => {
  if (!branchId) {
    return false
  }

  if (auth.hasRole('admin')) {
    return true
  }

  return auth.allowedBranches.some((branch) => branch.id === branchId)
}

const canReceive = computed(() =>
  auth.can('inventory.transfer') &&
  !auth.hasRole('super_admin') &&
  transfer.value?.status === 'pending' &&
  hasBranchAccess(transfer.value?.to_warehouse?.branch_id)
)

const canEdit = computed(() =>
  auth.can('inventory.transfer') &&
  !auth.hasRole('super_admin') &&
  transfer.value?.status === 'pending' &&
  (
    auth.hasRole('admin') ||
    transfer.value?.creator?.id === auth.user?.id
  ) &&
  hasBranchAccess(transfer.value?.from_warehouse?.branch_id)
)

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const statusLabel = (status) => {
  if (status === 'pending' || status === 'sent') return 'Pending'
  if (status === 'received') return 'Received'
  return status || 'Unknown'
}

const statusClasses = (status) => {
  if (status === 'pending' || status === 'sent') {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
  }

  if (status === 'received') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  }

  return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
}

const formatDate = (value) => {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString()
}

const formatDateTime = (value) => {
  if (!value) return 'Not recorded'

  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

const matchesTransferItemSearch = (item, search) => {
  const keyword = search.trim().toLowerCase()

  if (!keyword) {
    return true
  }

  return [
    item.product?.name,
    item.variation?.name,
    item.variation?.sku,
    item.product?.sku,
    item.lot?.lot_number,
    item.serial?.serial_number,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(keyword))
}

const filteredTransferItems = computed(() =>
  (transfer.value?.items || []).filter((item) => matchesTransferItemSearch(item, lineSearch.value))
)

const goBack = () => {
  router.push({ name: 'inventory-transfers' })
}

const loadTransfer = async () => {
  loading.value = true
  loadError.value = ''
  lineSearch.value = ''

  try {
    transfer.value = await store.fetchItem(route.params.id)
  } catch (error) {
    loadError.value = error.response?.data?.message || 'Unable to load this stock transfer.'
  } finally {
    loading.value = false
  }
}

const openEditPage = () => {
  if (!transfer.value?.id) {
    return
  }

  router.push({ name: 'inventory-transfer-edit', params: { id: transfer.value.id } })
}

const receiveTransfer = async () => {
  if (!transfer.value) return

  try {
    await store.receiveItem(transfer.value.id)
    await loadTransfer()
    showToast('success', `Transfer ${transfer.value.reference_no} received successfully.`)
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to receive this stock transfer.')
  }
}

onMounted(async () => {
  await Promise.all([
    optionsStore.fetchOptions(),
    loadTransfer(),
  ])
})
</script>
