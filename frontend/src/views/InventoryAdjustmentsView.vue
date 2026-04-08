<template>
  <AppLayout
    title="Stock Adjustments"
    subtitle="Record manual stock increases and decreases for allowed warehouses."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Inventory' },
      { label: 'Adjustments' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Stock Adjustments"
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
            New adjustment
          </button>
        </template>

        <template #reference="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.reference_no }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ formatDate(row.date) }}</div>
          </div>
        </template>

        <template #warehouse="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.warehouse?.name || 'Unknown warehouse' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.warehouse?.branch_name || 'No branch' }}</div>
          </div>
        </template>

        <template #reason="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            {{ row.reason || row.notes || 'Manual adjustment' }}
          </div>
        </template>

        <template #items_count="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ row.items?.length || 0 }} line(s)</span>
        </template>

        <template #creator="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ row.creator?.name || 'System' }}</span>
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            class="erp-button-secondary inline-flex h-10 w-10 items-center justify-center p-0"
            title="Preview adjustment"
            aria-label="Preview adjustment"
            @click="openDetail(row.id)"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
        </template>
      </DataTable>

      <AppModal :show="modal.show" title="Create stock adjustment" icon="adjustment" size="xl" @close="closeModal">
        <div class="space-y-5">
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="erp-label">Warehouse</label>
              <AppSelect
                :model-value="form.warehouse_id || null"
                :options="warehouseOptions"
                searchable
                placeholder="Select warehouse"
                search-placeholder="Search warehouses"
                @update:model-value="form.warehouse_id = $event || ''"
              />
            </div>
            <div>
              <label class="erp-label">Date</label>
              <AppDatePicker v-model="form.date" />
            </div>
            <div>
              <label class="erp-label">Reason</label>
              <input v-model="form.reason" type="text" class="erp-input" placeholder="Optional reason" />
            </div>
          </div>

          <div>
            <label class="erp-label">Notes</label>
            <textarea v-model="form.notes" rows="2" class="erp-input"></textarea>
          </div>

          <div class="space-y-3 rounded-[5px] border border-slate-200 p-4 dark:border-slate-800">
            <div class="space-y-3">
              <div>
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Adjustment items</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Scan or search once, then the matched item drops into the table automatically.</div>
              </div>
              <InventoryProductLookup
                :warehouse-id="form.warehouse_id"
                :helper-text="form.warehouse_id ? 'Exact SKU, lot, and serial scans auto-add immediately.' : 'Choose a warehouse first if you want lot and serial matches.'"
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
                      <th class="w-[42%]">Product</th>
                      <th class="w-[14%]">Direction</th>
                      <th class="w-[14%]">Quantity</th>
                      <th class="w-[14%]">Unit cost</th>
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
                          <span v-if="item.sku" class="erp-badge erp-badge-neutral px-2 text-[11px]">SKU: {{ item.sku }}</span>
                          <span v-if="item.lot_number" class="erp-badge erp-badge-warning px-2 text-[11px]">Lot: {{ item.lot_number }}</span>
                          <span v-if="item.serial_number" class="erp-badge erp-badge-info px-2 text-[11px]">Serial: {{ item.serial_number }}</span>
                        </div>
                      </td>
                      <td>
                        <AppSelect
                          :model-value="item.direction"
                          :options="adjustmentDirectionOptions"
                          @update:model-value="item.direction = $event || 'in'"
                        />
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
              Save adjustment
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useInventoryAdjustmentsStore, useInventoryOptionsStore } from '@stores/inventory'

const auth = useAuthStore()
const store = useInventoryAdjustmentsStore()
const optionsStore = useInventoryOptionsStore()
const router = useRouter()

const canCreate = computed(() => auth.can('inventory.adjust'))
const columns = [
  { key: 'reference', label: 'Reference' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'reason', label: 'Reason' },
  { key: 'items_count', label: 'Lines' },
  { key: 'creator', label: 'Created by' },
  { key: 'actions', label: 'Actions' },
]
const adjustmentDirectionOptions = [
  { value: 'in', label: 'In' },
  { value: 'out', label: 'Out' },
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
  direction: 'in',
  quantity: 1,
  unit_cost: 0,
})

const form = reactive({
  warehouse_id: '',
  date: new Date().toISOString().slice(0, 10),
  reason: '',
  notes: '',
  items: [],
})

const warehouseOptions = computed(() =>
  optionsStore.warehouses.map((warehouse) => ({
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
  form.warehouse_id = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.reason = ''
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

const openDetail = (id) => {
  router.push({ name: 'inventory-adjustment-detail', params: { id } })
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
  if (!form.warehouse_id) {
    showToast('danger', 'Warehouse is required.')
    return
  }

  const items = form.items
    .filter((item) => item.product_id && Number(item.quantity) > 0)
    .map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id || null,
      lot_id: item.lot_id || null,
      serial_id: item.serial_id || null,
      direction: item.direction,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unit_cost || 0),
    }))

  if (items.length === 0) {
    showToast('danger', 'Add at least one valid adjustment line.')
    return
  }

  try {
    await store.createItem({
      warehouse_id: form.warehouse_id,
      date: form.date,
      reason: form.reason || null,
      notes: form.notes || null,
      items,
    })
    closeModal()
    showToast('success', 'Stock adjustment created successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to create the stock adjustment.')
  }
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })
const formatDate = (value) => value || 'n/a'

onMounted(async () => {
  await Promise.all([
    optionsStore.fetchOptions(),
    store.fetchItems(),
  ])
})
</script>
