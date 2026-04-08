<template>
  <AppLayout
    title="Lots"
    subtitle="Monitor batch quantities, expiry dates, and lot lifecycle states."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Inventory' },
      { label: 'Lots' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Lots"
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
        <template #lot="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.lot_number }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.product?.name || 'Unknown product' }}</div>
          </div>
        </template>

        <template #warehouse="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.warehouse?.name || 'Unknown warehouse' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.warehouse?.branch_name || 'No branch' }}</div>
          </div>
        </template>

        <template #qty="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>On hand: {{ row.qty_on_hand }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">Available: {{ row.qty_available }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <span class="erp-badge" :class="lotStatusClass(row.status)">
            {{ row.status }}
          </span>
        </template>

        <template #actions="{ row }">
          <button v-if="canAdjust" type="button" class="erp-button-secondary" @click="openStatusModal(row)">
            Change status
          </button>
        </template>
      </DataTable>

      <AppModal :show="statusModal.show" title="Update lot status" icon="lot" size="md" @close="closeStatusModal">
        <div class="space-y-4">
          <div class="rounded-[5px] border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <div class="font-semibold text-slate-950 dark:text-white">{{ statusModal.lot?.lot_number }}</div>
            <div class="mt-1">{{ statusModal.lot?.product?.name || 'Unknown product' }}</div>
          </div>

          <div>
            <label class="erp-label">Status</label>
            <AppSelect
              :model-value="statusModal.status"
              :options="lotStatusOptions"
              placeholder="Select status"
              @update:model-value="statusModal.status = $event || 'active'"
            />
          </div>

          <div>
            <label class="erp-label">Reason</label>
            <textarea v-model="statusModal.reason" rows="2" class="erp-input"></textarea>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeStatusModal">Cancel</button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitStatus">
              <span v-if="store.saving" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              Save status
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useInventoryLotsStore } from '@stores/inventory'

const auth = useAuthStore()
const store = useInventoryLotsStore()
const canAdjust = computed(() => auth.can('inventory.adjust'))
const columns = [
  { key: 'lot', label: 'Lot' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'expiry_date', label: 'Expiry date' },
  { key: 'qty', label: 'Quantity' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]
const lotStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'depleted', label: 'Depleted' },
  { value: 'expired', label: 'Expired' },
  { value: 'recalled', label: 'Recalled' },
  { value: 'quarantine', label: 'Quarantine' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const statusModal = reactive({ show: false, lot: null, status: 'active', reason: '' })

const lotStatusClass = (status) => {
  if (status === 'active') return 'erp-badge-success'
  if (status === 'expired' || status === 'recalled') return 'erp-badge-danger'
  return 'erp-badge-warning'
}

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const openStatusModal = (row) => {
  statusModal.show = true
  statusModal.lot = row
  statusModal.status = row.status
  statusModal.reason = ''
}

const closeStatusModal = () => {
  statusModal.show = false
  statusModal.lot = null
  statusModal.status = 'active'
  statusModal.reason = ''
}

const submitStatus = async () => {
  try {
    await store.updateStatus(statusModal.lot.id, {
      status: statusModal.status,
      reason: statusModal.reason || null,
    })
    closeStatusModal()
    showToast('success', 'Lot status updated successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to update lot status.')
  }
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })

onMounted(() => {
  store.fetchItems()
})
</script>
