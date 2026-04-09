<template>
  <AppLayout
    title="Serials"
    subtitle="Track serialized items and write off individual units when necessary."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Inventory' },
      { label: 'Serials' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Serials"
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
        <template #serial="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.serial_number }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.product?.name || 'Unknown product' }}</div>
          </div>
        </template>

        <template #warehouse="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.warehouse?.name || 'No warehouse' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.warehouse?.branch_name || 'No branch' }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <span class="erp-badge" :class="serialStatusClass(row.status)">
            {{ row.status }}
          </span>
        </template>

        <template #warranty_expires="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ formatHumanDate(row.warranty_expires) }}</span>
        </template>

        <template #actions="{ row }">
          <button
            v-if="canAdjust && !['written_off', 'sold'].includes(row.status)"
            type="button"
            class="erp-button-secondary"
            @click="openWriteOffModal(row)"
          >
            Write off
          </button>
        </template>
      </DataTable>

      <AppModal :show="writeOffModal.show" title="Write off serial" icon="serial" size="md" @close="closeWriteOffModal">
        <div class="space-y-4">
          <div class="rounded-[5px] border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <div class="font-semibold text-slate-950 dark:text-white">{{ writeOffModal.serial?.serial_number }}</div>
            <div class="mt-1">{{ writeOffModal.serial?.product?.name || 'Unknown product' }}</div>
          </div>

          <div>
            <label class="erp-label">Reason</label>
            <textarea v-model="writeOffModal.reason" rows="3" class="erp-input" placeholder="Required reason for write-off"></textarea>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeWriteOffModal">Cancel</button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitWriteOff">
              <span v-if="store.saving" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              Confirm write-off
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
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { formatHumanDate } from '@/utils/date'
import { useAuthStore } from '@stores/auth'
import { useInventorySerialsStore } from '@stores/inventory'

const auth = useAuthStore()
const store = useInventorySerialsStore()
const canAdjust = computed(() => auth.can('inventory.adjust'))
const columns = [
  { key: 'serial', label: 'Serial' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'warranty_expires', label: 'Warranty expires' },
  { key: 'actions', label: 'Actions' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const writeOffModal = reactive({ show: false, serial: null, reason: '' })

const serialStatusClass = (status) => {
  if (status === 'in_stock' || status === 'returned') return 'erp-badge-success'
  if (status === 'written_off' || status === 'sold') return 'erp-badge-danger'
  return 'erp-badge-warning'
}

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const openWriteOffModal = (row) => {
  writeOffModal.show = true
  writeOffModal.serial = row
  writeOffModal.reason = ''
}

const closeWriteOffModal = () => {
  writeOffModal.show = false
  writeOffModal.serial = null
  writeOffModal.reason = ''
}

const submitWriteOff = async () => {
  if (!writeOffModal.reason.trim()) {
    showToast('danger', 'A write-off reason is required.')
    return
  }

  try {
    await store.writeOff(writeOffModal.serial.id, { reason: writeOffModal.reason.trim() })
    closeWriteOffModal()
    showToast('success', 'Serial written off successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to write off the serial.')
  }
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })

onMounted(() => {
  store.fetchItems()
})
</script>
