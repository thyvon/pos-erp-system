<template>
  <AppLayout
    title="Stock Transfers"
    subtitle="Move stock between warehouses while keeping warehouse and branch rules intact."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Inventory' },
      { label: 'Transfers' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <FilterPanel
        v-model:expanded="filtersExpanded"
        title="Filters"
        description="Narrow the transfer list by warehouse, direction, or status."
        :active-count="activeFilterCount"
        :show-clear="activeFilterCount > 0"
        @clear="resetFilters"
      >
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label class="erp-label">Warehouse</label>
            <AppSelect
              :model-value="store.filters.warehouse_id || null"
              :options="warehouseFilterOptions"
              clearable
              searchable
              placeholder="All warehouses"
              search-placeholder="Search warehouses"
              @update:model-value="handleWarehouseFilter($event)"
            />
          </div>
          <div>
            <label class="erp-label">Direction</label>
            <AppSelect
              :model-value="store.filters.direction || null"
              :options="directionFilterOptions"
              clearable
              :disabled="!store.filters.warehouse_id"
              :placeholder="store.filters.warehouse_id ? 'All directions' : 'Select warehouse first'"
              @update:model-value="handleDirectionFilter($event)"
            />
          </div>
          <div>
            <label class="erp-label">Status</label>
            <AppSelect
              :model-value="store.filters.status || null"
              :options="statusFilterOptions"
              clearable
              placeholder="All statuses"
              @update:model-value="handleStatusFilter($event)"
            />
          </div>
        </div>
      </FilterPanel>

      <DataTable
        title="Stock Transfers"
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
          <button v-if="canCreate" type="button" class="erp-button-primary" @click="openCreatePage">
            <i class="fa-solid fa-plus"></i>
            New transfer
          </button>
        </template>

        <template #reference="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.reference_no }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ formatDate(row.date) }}</div>
          </div>
        </template>

        <template #route="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.from_warehouse?.name || 'Unknown' }} → {{ row.to_warehouse?.name || 'Unknown' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.from_warehouse?.branch_name || 'No branch' }} → {{ row.to_warehouse?.branch_name || 'No branch' }}
            </div>
          </div>
        </template>

        <template #status="{ row }">
            <span class="erp-badge capitalize" :class="statusClasses(row.status)">
              {{ statusLabel(row.status) }}
            </span>
        </template>

        <template #sender="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.sender?.name || row.creator?.name || 'System' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ formatDateTime(row.sent_at || row.created_at) }}</div>
          </div>
        </template>

        <template #receiver="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.receiver?.name || 'Pending' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.received_at ? formatDateTime(row.received_at) : 'Waiting for destination confirmation' }}
            </div>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="erp-button-secondary inline-flex h-10 w-10 items-center justify-center p-0"
              title="Preview transfer"
              aria-label="Preview transfer"
              @click="openDetail(row.id)"
            >
              <i class="fa-solid fa-eye"></i>
            </button>
            <button
              v-if="canEditFromList(row)"
              type="button"
              class="erp-button-secondary inline-flex h-10 w-10 items-center justify-center p-0"
              title="Edit transfer"
              aria-label="Edit transfer"
              @click="openEdit(row.id)"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              v-if="canDeleteFromList(row)"
              type="button"
              class="erp-button-secondary inline-flex h-10 w-10 items-center justify-center p-0 text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
              :disabled="store.deletingId === row.id"
              title="Delete transfer"
              aria-label="Delete transfer"
              @click="openDeleteModal(row)"
            >
              <span
                v-if="store.deletingId === row.id"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-300/30 border-t-rose-600 dark:border-rose-400/30 dark:border-t-rose-200"
              ></span>
              <i v-else class="fa-solid fa-trash"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <ConfirmDelete
        :show="deleteDialog.show"
        :item-name="deleteDialog.itemName"
        :loading="store.deletingId === deleteDialog.transferId"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppAlert from '@components/ui/AppAlert.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useInventoryOptionsStore, useInventoryTransfersStore } from '@stores/inventory'
import {
  getStockTransferStatusClasses,
  getStockTransferStatusLabel,
  isStockTransferEditable,
  isStockTransferPending,
  TRANSFER_STATUS_IN_TRANSIT,
  TRANSFER_STATUS_PENDING,
  TRANSFER_STATUS_RECEIVED,
} from '../utils/stockTransferStatus'

const auth = useAuthStore()
const store = useInventoryTransfersStore()
const optionsStore = useInventoryOptionsStore()
const router = useRouter()

const canCreate = computed(() =>
  auth.can('inventory.transfer') &&
  !auth.hasRole('super_admin')
)
const filtersExpanded = ref(false)
const columns = [
  { key: 'reference', label: 'Reference' },
  { key: 'route', label: 'Route' },
  { key: 'status', label: 'Status' },
  { key: 'sender', label: 'Sender' },
  { key: 'receiver', label: 'Receiver' },
  { key: 'actions', label: 'Actions' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const deleteDialog = reactive({ show: false, transferId: '', itemName: '' })

const warehouseFilterOptions = computed(() =>
  optionsStore.warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.branch_name || warehouse.code,
  }))
)

const directionFilterOptions = [
  { value: 'out', label: 'Transfer out' },
  { value: 'in', label: 'Transfer in' },
]

const statusFilterOptions = [
  { value: TRANSFER_STATUS_PENDING, label: 'Pending' },
  { value: TRANSFER_STATUS_IN_TRANSIT, label: 'In Transit' },
  { value: TRANSFER_STATUS_RECEIVED, label: 'Received' },
]

const activeFilterCount = computed(() =>
  [
    store.filters.warehouse_id,
    store.filters.direction,
    store.filters.status,
  ].filter((value) => value !== '' && value !== null && value !== undefined).length
)

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
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

const statusLabel = getStockTransferStatusLabel
const statusClasses = getStockTransferStatusClasses

const resetFilters = () => {
  store.fetchItems({
    warehouse_id: '',
    direction: '',
    status: '',
    page: 1,
  })
}

const openCreatePage = () => {
  router.push({ name: 'inventory-transfer-create' })
}

const openDetail = (id) => {
  router.push({ name: 'inventory-transfer-detail', params: { id } })
}

const openEdit = (id) => {
  router.push({ name: 'inventory-transfer-edit', params: { id } })
}

const openDeleteModal = (row) => {
  if (!row?.id || !canEditFromList(row)) {
    return
  }

  deleteDialog.transferId = row.id
  deleteDialog.itemName = row.reference_no || 'this transfer'
  deleteDialog.show = true
}

const closeDeleteModal = () => {
  if (store.deletingId) {
    return
  }

  deleteDialog.show = false
  deleteDialog.transferId = ''
  deleteDialog.itemName = ''
}

const confirmDelete = async () => {
  if (!deleteDialog.transferId) {
    return
  }

  try {
    const deletedName = deleteDialog.itemName
    await store.deleteItem(deleteDialog.transferId)
    closeDeleteModal()
    showToast('success', `Transfer ${deletedName} deleted successfully.`)
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete this stock transfer.')
  }
}

const canEditFromList = (row) => {
  if (!auth.can('inventory.transfer') || auth.hasRole('super_admin') || !isStockTransferEditable(row?.status)) {
    return false
  }

  const isOwner = row?.creator?.id === auth.user?.id
  const isAdmin = auth.hasRole('admin')

  if (!isOwner && !isAdmin) {
    return false
  }

  if (auth.hasRole('admin')) {
    return true
  }

  const fromBranchId = row?.from_warehouse?.branch_id

  if (!fromBranchId) {
    return false
  }

  return auth.allowedBranches.some((branch) => branch.id === fromBranchId)
}

const canDeleteFromList = (row) => canEditFromList(row) && isStockTransferPending(row?.status)

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })
const handleWarehouseFilter = (value) => store.fetchItems({
  warehouse_id: value || '',
  direction: value ? store.filters.direction : '',
  page: 1,
})
const handleDirectionFilter = (value) => {
  if (!store.filters.warehouse_id) {
    store.fetchItems({ direction: '', page: 1 })
    return
  }

  store.fetchItems({ direction: value || '', page: 1 })
}
const handleStatusFilter = (value) => store.fetchItems({ status: value || '', page: 1 })

onMounted(async () => {
  await Promise.all([
    optionsStore.fetchOptions(),
    store.fetchItems(),
  ])
})
</script>
