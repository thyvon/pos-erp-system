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
          <button v-if="canCreate" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New transfer
          </button>
        </template>

        <template #reference="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.reference_no }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.status }}</div>
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

        <template #items_count="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ row.items?.length || 0 }} line(s)</span>
        </template>

        <template #creator="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ row.creator?.name || 'System' }}</span>
        </template>
      </DataTable>

      <AppModal :show="modal.show" title="Create stock transfer" icon="transfer" size="xl" @close="closeModal">
        <div class="space-y-5">
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="erp-label">From warehouse</label>
              <AppSelect
                :model-value="form.from_warehouse_id || null"
                :options="fromWarehouseOptions"
                searchable
                placeholder="Select source"
                search-placeholder="Search source warehouse"
                @update:model-value="form.from_warehouse_id = $event || ''"
              />
            </div>
            <div>
              <label class="erp-label">To warehouse</label>
              <AppSelect
                :model-value="form.to_warehouse_id || null"
                :options="toWarehouseOptions"
                searchable
                placeholder="Select destination"
                search-placeholder="Search destination warehouse"
                @update:model-value="form.to_warehouse_id = $event || ''"
              />
            </div>
            <div>
              <label class="erp-label">Date</label>
              <AppDatePicker v-model="form.date" />
            </div>
          </div>

          <div>
            <label class="erp-label">Notes</label>
            <textarea v-model="form.notes" rows="2" class="erp-input"></textarea>
          </div>

          <div class="space-y-3 rounded-[5px] border border-slate-200 p-4 dark:border-slate-800">
            <div class="space-y-3">
              <div>
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Transfer items</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Scan or search against the source warehouse, then the line is inserted automatically.</div>
              </div>
              <InventoryProductLookup
                :warehouse-id="form.from_warehouse_id"
                :helper-text="form.from_warehouse_id ? 'Serial and lot matches are scoped to the source warehouse.' : 'Choose the source warehouse first for scanner-aware matches.'"
                @select="handleLookupSelect"
              />
            </div>

            <div
              v-if="form.items.length === 0"
              class="rounded-[5px] border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
            >
              No lines yet. Scan or search a product above to start.
            </div>

            <div v-else class="erp-table-shell">
              <div class="overflow-x-auto">
                <table class="erp-table min-w-full">
                  <thead>
                    <tr>
                      <th class="w-[54%]">Product</th>
                      <th class="w-[14%]">Quantity</th>
                      <th class="w-[16%]">Unit cost</th>
                      <th class="w-[16%]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in form.items" :key="item.key">
                      <td>
                        <div class="font-semibold text-slate-950 dark:text-white">
                          {{ item.product_name || 'Selected item' }}
                          <span v-if="item.variation_name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation_name }}</span>
                        </div>
                        <div class="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span v-if="item.sku" class="rounded-[5px] bg-slate-100 px-2 py-1 dark:bg-slate-800">SKU: {{ item.sku }}</span>
                          <span v-if="item.lot_number" class="rounded-[5px] bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300">Lot: {{ item.lot_number }}</span>
                          <span v-if="item.serial_number" class="rounded-[5px] bg-violet-50 px-2 py-1 text-violet-700 dark:bg-violet-950/35 dark:text-violet-300">Serial: {{ item.serial_number }}</span>
                        </div>
                      </td>
                      <td>
                        <input v-model.number="item.quantity" type="number" min="0" step="0.0001" class="erp-input" />
                      </td>
                      <td>
                        <input v-model.number="item.unit_cost" type="number" min="0" step="0.0001" class="erp-input" />
                      </td>
                      <td>
                        <button type="button" class="erp-button-secondary w-full" @click="removeItem(index)">Remove</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitForm">
              <span v-if="store.saving" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              Save transfer
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useInventoryOptionsStore, useInventoryTransfersStore } from '@stores/inventory'

const auth = useAuthStore()
const store = useInventoryTransfersStore()
const optionsStore = useInventoryOptionsStore()

const canCreate = computed(() => auth.can('inventory.transfer'))
const columns = [
  { key: 'reference', label: 'Reference' },
  { key: 'route', label: 'Route' },
  { key: 'items_count', label: 'Lines' },
  { key: 'creator', label: 'Created by' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false })

const createItemState = () => ({
  key: `${Date.now()}-${Math.random()}`,
  product_id: '',
  variation_id: '',
  lot_id: '',
  serial_id: '',
  product_name: '',
  variation_name: '',
  sku: '',
  lot_number: '',
  serial_number: '',
  quantity: 1,
  unit_cost: 0,
})

const form = reactive({
  from_warehouse_id: '',
  to_warehouse_id: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  items: [],
})

const fromWarehouseOptions = computed(() =>
  optionsStore.transferFromWarehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.branch_name || warehouse.code,
  }))
)

const toWarehouseOptions = computed(() =>
  optionsStore.transferToWarehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.branch_name || warehouse.code,
  }))
)

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const resetForm = () => {
  form.from_warehouse_id = ''
  form.to_warehouse_id = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.notes = ''
  form.items = []
}

const openCreateModal = () => {
  resetForm()
  modal.show = true
}

const closeModal = () => {
  modal.show = false
}

const removeItem = (index) => {
  form.items.splice(index, 1)
}

const isSameLookupItem = (item, match) =>
  item.product_id === match.product_id &&
  (item.variation_id || '') === (match.variation_id || '') &&
  (item.lot_id || '') === (match.lot_id || '') &&
  (item.serial_id || '') === (match.serial_id || '')

const handleLookupSelect = (match) => {
  const existing = form.items.find((item) => isSameLookupItem(item, match))

  if (existing) {
    existing.quantity = Number(existing.quantity || 0) + 1

    if (!Number(existing.unit_cost || 0) && match.unit_cost) {
      existing.unit_cost = Number(match.unit_cost)
    }

    return
  }

  form.items.push({
    ...createItemState(),
    product_id: match.product_id,
    variation_id: match.variation_id || '',
    lot_id: match.lot_id || '',
    serial_id: match.serial_id || '',
    product_name: match.product_name || '',
    variation_name: match.variation_name || '',
    sku: match.sku || '',
    lot_number: match.lot_number || '',
    serial_number: match.serial_number || '',
    unit_cost: Number(match.unit_cost || 0),
  })
}

const submitForm = async () => {
  if (!form.from_warehouse_id || !form.to_warehouse_id) {
    showToast('danger', 'Both source and destination warehouses are required.')
    return
  }

  if (form.from_warehouse_id === form.to_warehouse_id) {
    showToast('danger', 'Source and destination warehouses must be different.')
    return
  }

  const items = form.items
    .filter((item) => item.product_id && Number(item.quantity) > 0)
    .map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id || null,
      lot_id: item.lot_id || null,
      serial_id: item.serial_id || null,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unit_cost || 0),
    }))

  if (items.length === 0) {
    showToast('danger', 'Add at least one valid transfer line.')
    return
  }

  try {
    await store.createItem({
      from_warehouse_id: form.from_warehouse_id,
      to_warehouse_id: form.to_warehouse_id,
      date: form.date,
      notes: form.notes || null,
      items,
    })
    closeModal()
    showToast('success', 'Stock transfer created successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to create the stock transfer.')
  }
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })

onMounted(async () => {
  await Promise.all([
    optionsStore.fetchOptions(),
    store.fetchItems(),
  ])
})
</script>
