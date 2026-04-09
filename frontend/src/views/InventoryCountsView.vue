<template>
  <AppLayout
    title="Stock Counts"
    subtitle="Start, review, and manage stock count sessions before opening the dedicated counting workspace."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Inventory' },
      { label: 'Counts' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Stock Counts"
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
          <button v-if="canCreate" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New count
          </button>
        </template>

        <template #reference="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.reference_no }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ formatHumanDate(row.date) }}</div>
          </div>
        </template>

        <template #warehouse="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.warehouse?.name || 'Unknown warehouse' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.warehouse?.branch_name || 'No branch' }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <span class="erp-badge" :class="statusClass(row.status)">
            {{ formatStatus(row.status) }}
          </span>
        </template>

        <template #discrepancies="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ row.discrepancy_count || 0 }}</span>
        </template>

        <template #actions="{ row }">
          <div class="flex flex-wrap justify-end gap-2">
            <button
              v-if="canCreate && row.status !== 'cancelled'"
              type="button"
              class="erp-button-secondary"
              @click="openWorkspaceModal(row.id)"
            >
              {{ row.status === 'completed' ? 'Review count' : 'Open count' }}
            </button>
            <button
              v-if="canDeleteCount(row)"
              type="button"
              class="erp-button-secondary border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/20"
              :disabled="store.deletingCountId === row.id"
              @click="deleteCount(row)"
            >
              <span
                v-if="store.deletingCountId === row.id"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-300/30 border-t-rose-700 dark:border-rose-500/30 dark:border-t-rose-200"
              ></span>
              <span v-else>Delete</span>
            </button>
          </div>
        </template>
      </DataTable>

      <ConfirmDelete
        :show="deleteDialog.show"
        :item-name="deleteDialog.itemName"
        :loading="store.deletingCountId === deleteDialog.countId"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppAlert from '@components/ui/AppAlert.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { formatHumanDate } from '@/utils/date'
import { useAuthStore } from '@stores/auth'
import { useInventoryCountsStore } from '@stores/inventory'

const auth = useAuthStore()
const router = useRouter()
const store = useInventoryCountsStore()

const canCreate = computed(() => auth.can('inventory.count'))
const canDeleteCount = (row) => canCreate.value && row?.status === 'in_progress'
const columns = [
  { key: 'reference', label: 'Reference' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'discrepancies', label: 'Discrepancies' },
  { key: 'actions', label: 'Actions' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const deleteDialog = reactive({ show: false, countId: '', itemName: '' })

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const statusClass = (status) => {
  if (status === 'completed') return 'erp-badge-success'
  if (status === 'cancelled') return 'erp-badge-danger'
  return 'erp-badge-warning'
}

const formatStatus = (status) => status.replaceAll('_', ' ')

const openCreateModal = () => {
  router.push({ name: 'inventory-counts-create' })
}

const openWorkspaceModal = (countId) => {
  router.push({ name: 'inventory-counts-workspace', params: { id: countId } })
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })

const deleteCount = (row) => {
  if (!canDeleteCount(row)) {
    return
  }

  deleteDialog.countId = row.id
  deleteDialog.itemName = row.reference_no || 'this stock count'
  deleteDialog.show = true
}

const closeDeleteModal = () => {
  if (store.deletingCountId === deleteDialog.countId) {
    return
  }

  deleteDialog.show = false
  deleteDialog.countId = ''
  deleteDialog.itemName = ''
}

const confirmDelete = async () => {
  if (!deleteDialog.countId) {
    return
  }

  try {
    await store.deleteCount(deleteDialog.countId)
    const label = deleteDialog.itemName
    closeDeleteModal()
    showToast('success', `Stock count ${label} deleted successfully.`)
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the stock count.')
  }
}

onMounted(() => {
  store.fetchItems()
})
</script>
