<template>
  <AppLayout
    title="Stock Counts"
    subtitle="Run shared warehouse counts with live entry, scanner-friendly lookup, and safe final reconciliation."
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
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.date }}</div>
          </div>
        </template>

        <template #warehouse="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.warehouse?.name || 'Unknown warehouse' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.warehouse?.branch_name || 'No branch' }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClass(row.status)">
            {{ formatStatus(row.status) }}
          </span>
        </template>

        <template #discrepancies="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ row.discrepancy_count || 0 }}</span>
        </template>

        <template #actions="{ row }">
          <button
            v-if="canCreate && row.status === 'in_progress'"
            type="button"
            class="erp-button-secondary"
            @click="openWorkspaceModal(row.id)"
          >
            Open count
          </button>
        </template>
      </DataTable>

      <AppModal :show="createModal.show" title="Start stock count" icon="count" size="lg" @close="closeCreateModal">
        <div class="space-y-5">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">Warehouse</label>
              <AppSelect
                :model-value="createForm.warehouse_id || null"
                :options="warehouseOptions"
                searchable
                placeholder="Select warehouse"
                @update:model-value="createForm.warehouse_id = $event || ''"
              />
            </div>
            <div>
              <label class="erp-label">Date</label>
              <AppDatePicker v-model="createForm.date" />
            </div>
          </div>

          <div>
            <label class="erp-label">Notes</label>
            <textarea v-model="createForm.notes" rows="2" class="erp-input"></textarea>
          </div>

          <div class="rounded-[5px] border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            Start the count session first. After that, the live count workspace will open so the team can scan or search items and save quantities directly into the same session.
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeCreateModal">Cancel</button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitCreate">
              <span v-if="store.saving" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              Start count
            </button>
          </div>
        </div>
      </AppModal>

      <AppModal :show="workspaceModal.show" title="Live stock count" icon="count" size="xl" @close="closeWorkspaceModal">
        <div class="space-y-5">
          <div v-if="workspaceModal.loading" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading count workspace...</div>

          <template v-else>
            <div class="grid gap-3 rounded-[10px] border border-slate-200 p-4 md:grid-cols-4 dark:border-slate-800">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reference</div>
                <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{{ workspaceModal.reference_no || 'Pending' }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Warehouse</div>
                <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{{ workspaceModal.warehouse?.name || 'Unknown warehouse' }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Date</div>
                <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{{ workspaceModal.date || 'Not set' }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Live mode</div>
                <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">Refreshes every 5 seconds while the session is open.</div>
              </div>
            </div>

            <div class="sticky top-0 z-10 -mx-4 border-y border-slate-200 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 md:static md:mx-0 md:rounded-[10px] md:border md:px-4 md:shadow-none">
              <div>
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Scan or search first</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  Scan or search by lot, serial, SKU, name, or description. After you pick the item, enter the counted quantity and save it into this shared session.
                </div>
              </div>

              <div class="mt-3">
                <label class="erp-label">Scan or search item</label>
                <InventoryProductLookup
                  :warehouse-id="workspaceModal.warehouse?.id || ''"
                  :disabled="store.recording || store.completing"
                  helper-text="Lot and serial matches still resolve to the correct product or variant for quantity counting."
                  @select="handleLookupSelect"
                />
              </div>

              <div
                v-if="workspaceModal.pending_item"
                class="mt-4 rounded-[12px] border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-900/50 dark:bg-cyan-950/20"
              >
                <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div class="min-w-0">
                    <div class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Selected item</div>
                    <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {{ workspaceModal.pending_item.product_name || 'Selected item' }}
                      <span v-if="workspaceModal.pending_item.variation_name" class="text-slate-500 dark:text-slate-400">/ {{ workspaceModal.pending_item.variation_name }}</span>
                    </div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {{ workspaceModal.pending_item.sku || 'No SKU' }}
                    </div>
                    <div class="mt-2 inline-flex rounded-[8px] bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300">
                      Ending qty: {{ formatQuantity(workspaceModal.pending_item.ending_quantity) }}
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-[minmax(0,180px)_auto_auto] sm:items-end">
                    <div>
                      <label class="erp-label">Qty to add</label>
                      <input
                        ref="entryQuantityInput"
                        v-model.number="workspaceModal.entry_quantity"
                        type="number"
                        step="0.0001"
                        class="erp-input h-14 text-center text-xl font-semibold"
                        :disabled="store.recording || store.completing"
                        @keydown.enter.prevent="submitPendingEntry"
                      />
                    </div>
                    <button
                      type="button"
                      class="erp-button-primary h-12 px-5"
                      :disabled="store.recording || store.completing"
                      @click="submitPendingEntry"
                    >
                      <span v-if="store.recording" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                      <span v-else>Add count</span>
                    </button>
                    <button
                      type="button"
                      class="erp-button-secondary h-12 px-5"
                      :disabled="store.recording || store.completing"
                      @click="clearPendingItem"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Repeated saves for the same product or variant are added into the same counted total.
                </div>
              </div>
            </div>

            <div
              v-if="workspaceModal.items.length === 0"
              class="rounded-[10px] border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
            >
              No counted lines yet. Scan or search an item above to start capturing quantities.
            </div>

            <div v-else class="space-y-3 md:hidden">
              <div
                v-for="item in workspaceModal.items"
                :key="item.id"
                class="rounded-[12px] border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-slate-950 dark:text-white">
                      {{ item.product?.name || 'Unknown product' }}
                      <span v-if="item.variation?.name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation.name }}</span>
                    </div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {{ item.variation?.sku || item.product?.sku || 'No SKU' }}
                    </div>
                  </div>
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="differenceClass(item.difference)"
                  >
                    {{ formatSignedQuantity(item.difference) }}
                  </span>
                </div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-[10px] bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">System qty</div>
                    <div class="mt-1 text-base font-semibold text-slate-950 dark:text-white">{{ formatQuantity(item.system_quantity) }}</div>
                  </div>
                  <div>
                    <label class="erp-label">Counted qty</label>
                    <input
                      v-model.number="item.editable_counted_quantity"
                      type="number"
                      min="0"
                      step="0.0001"
                      class="erp-input h-12 text-lg font-semibold"
                      :disabled="store.recording || store.completing || isUpdatingItem(item.id)"
                      @focus="workspaceModal.last_local_activity_at = Date.now()"
                      @keydown.enter.prevent="submitItemUpdate(item)"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  class="erp-button-secondary mt-4 w-full"
                  :disabled="store.recording || store.completing || !hasItemChanged(item) || isUpdatingItem(item.id)"
                  @click="submitItemUpdate(item)"
                >
                  <span v-if="isUpdatingItem(item.id)" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-700 dark:border-slate-500/30 dark:border-t-slate-200"></span>
                  <span v-else>Update counted qty</span>
                </button>
              </div>
            </div>

            <div v-if="workspaceModal.items.length > 0" class="hidden md:block erp-table-shell">
              <div class="overflow-x-auto">
                <table class="erp-table min-w-full">
                  <thead>
                    <tr>
                      <th class="w-[38%]">Product</th>
                      <th class="w-[18%]">SKU</th>
                      <th class="w-[14%]">System qty</th>
                      <th class="w-[18%]">Counted qty</th>
                      <th class="w-[12%]">Difference</th>
                      <th class="w-[14%]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in workspaceModal.items" :key="item.id">
                      <td>
                        <div class="font-semibold text-slate-950 dark:text-white">
                          {{ item.product?.name || 'Unknown product' }}
                          <span v-if="item.variation?.name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation.name }}</span>
                        </div>
                      </td>
                      <td class="text-sm text-slate-600 dark:text-slate-300">
                        {{ item.variation?.sku || item.product?.sku || 'No SKU' }}
                      </td>
                      <td class="text-sm text-slate-600 dark:text-slate-300">
                        {{ formatQuantity(item.system_quantity) }}
                      </td>
                      <td>
                        <input
                          v-model.number="item.editable_counted_quantity"
                          type="number"
                          min="0"
                          step="0.0001"
                          class="erp-input"
                          :disabled="store.recording || store.completing || isUpdatingItem(item.id)"
                          @focus="workspaceModal.last_local_activity_at = Date.now()"
                          @keydown.enter.prevent="submitItemUpdate(item)"
                        />
                      </td>
                      <td>
                        <span
                          class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                          :class="differenceClass(item.difference)"
                        >
                          {{ formatSignedQuantity(item.difference) }}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="erp-button-secondary w-full"
                          :disabled="store.recording || store.completing || !hasItemChanged(item) || isUpdatingItem(item.id)"
                          @click="submitItemUpdate(item)"
                        >
                          <span v-if="isUpdatingItem(item.id)" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-700 dark:border-slate-500/30 dark:border-t-slate-200"></span>
                          <span v-else>Update</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-[10px] border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              Completing the session compares the counted totals above against the snapped system quantities and posts only the difference as stock count correction movements.
            </div>

            <div class="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white px-4 pb-1 pt-3 dark:border-slate-800 dark:bg-slate-900 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
              <div class="erp-form-actions">
              <button type="button" class="erp-button-secondary" :disabled="store.recording || store.completing" @click="closeWorkspaceModal">Close</button>
              <button type="button" class="erp-button-primary" :disabled="store.recording || store.completing" @click="submitComplete">
                <span v-if="store.completing" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                Complete count
              </button>
              </div>
            </div>
          </template>
        </div>
      </AppModal>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useInventoryCountsStore, useInventoryOptionsStore } from '@stores/inventory'

const auth = useAuthStore()
const store = useInventoryCountsStore()
const optionsStore = useInventoryOptionsStore()

const canCreate = computed(() => auth.can('inventory.count'))
const columns = [
  { key: 'reference', label: 'Reference' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'discrepancies', label: 'Discrepancies' },
  { key: 'actions', label: 'Actions' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const entryQuantityInput = ref(null)
const createModal = reactive({ show: false })
const workspaceModal = reactive({
  show: false,
  loading: false,
  count_id: '',
  reference_no: '',
  warehouse: null,
  date: '',
  notes: '',
  status: '',
  entry_quantity: 1,
  pending_item: null,
  items: [],
  last_local_activity_at: 0,
})

let workspaceRefreshTimer = null

const createForm = reactive({
  warehouse_id: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
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

const statusClass = (status) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  if (status === 'cancelled') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
}

const differenceClass = (difference) => {
  const value = Number(difference || 0)

  if (value > 0) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  }

  if (value < 0) {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
  }

  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

const formatStatus = (status) => status.replace('_', ' ')
const formatQuantity = (value) => Number(value || 0).toFixed(4)
const formatSignedQuantity = (value) => {
  const number = Number(value || 0)
  return `${number > 0 ? '+' : ''}${number.toFixed(4)}`
}

const sortCountItems = (items = []) => [...items].sort((left, right) => {
  const leftLabel = `${left.product?.name || ''} ${left.variation?.name || ''}`.trim().toLowerCase()
  const rightLabel = `${right.product?.name || ''} ${right.variation?.name || ''}`.trim().toLowerCase()

  return leftLabel.localeCompare(rightLabel)
})

const hydrateWorkspace = (count) => {
  workspaceModal.count_id = count.id
  workspaceModal.reference_no = count.reference_no
  workspaceModal.warehouse = count.warehouse || null
  workspaceModal.date = count.date || ''
  workspaceModal.notes = count.notes || ''
  workspaceModal.status = count.status || ''
  workspaceModal.items = sortCountItems(count.items || []).map((item) => ({
    ...item,
    editable_counted_quantity: Number(item.counted_quantity ?? 0),
  }))
}

const isUpdatingItem = (itemId) => store.updatingItemId === itemId
const hasItemChanged = (item) => Number(item.editable_counted_quantity ?? 0) !== Number(item.counted_quantity ?? 0)

const resetCreateForm = () => {
  createForm.warehouse_id = ''
  createForm.date = new Date().toISOString().slice(0, 10)
  createForm.notes = ''
}

const resetWorkspace = () => {
  workspaceModal.count_id = ''
  workspaceModal.reference_no = ''
  workspaceModal.warehouse = null
  workspaceModal.date = ''
  workspaceModal.notes = ''
  workspaceModal.status = ''
  workspaceModal.entry_quantity = 1
  workspaceModal.pending_item = null
  workspaceModal.items = []
  workspaceModal.last_local_activity_at = 0
}

const stopWorkspacePolling = () => {
  if (workspaceRefreshTimer) {
    window.clearInterval(workspaceRefreshTimer)
    workspaceRefreshTimer = null
  }
}

const refreshWorkspace = async (countId = workspaceModal.count_id, showLoader = false) => {
  if (!countId) {
    return
  }

  if (showLoader) {
    workspaceModal.loading = true
  }

  try {
    const count = await store.fetchItem(countId)
    hydrateWorkspace(count)
  } finally {
    if (showLoader) {
      workspaceModal.loading = false
    }
  }
}

const startWorkspacePolling = () => {
  stopWorkspacePolling()

  workspaceRefreshTimer = window.setInterval(async () => {
    if (!workspaceModal.show || !workspaceModal.count_id || store.recording || store.completing) {
      return
    }

    if (Date.now() - workspaceModal.last_local_activity_at < 2000) {
      return
    }

    try {
      await refreshWorkspace(workspaceModal.count_id, false)
    } catch {
      // Keep polling silent; user-facing errors still surface on direct actions.
    }
  }, 5000)
}

const openCreateModal = () => {
  resetCreateForm()
  createModal.show = true
}

const closeCreateModal = () => {
  createModal.show = false
}

const openWorkspaceModal = async (countId) => {
  resetWorkspace()
  workspaceModal.show = true

  try {
    await refreshWorkspace(countId, true)
    startWorkspacePolling()
  } catch (error) {
    closeWorkspaceModal()
    showToast('danger', error.response?.data?.message || 'Unable to open the stock count workspace.')
  }
}

const closeWorkspaceModal = () => {
  stopWorkspacePolling()
  workspaceModal.show = false
  workspaceModal.loading = false
  resetWorkspace()
}

const clearPendingItem = () => {
  workspaceModal.pending_item = null
  workspaceModal.entry_quantity = 1
}

const handleLookupSelect = async (match) => {
  if (!workspaceModal.count_id) {
    showToast('danger', 'Open a stock count session first.')
    return
  }

  workspaceModal.pending_item = {
    product_id: match.product_id,
    variation_id: match.variation_id || null,
    product_name: match.product_name || '',
    variation_name: match.variation_name || '',
    sku: match.sku || '',
    ending_quantity: Number(match.ending_quantity || 0),
    unit_cost: Number(match.unit_cost || 0),
  }
  workspaceModal.entry_quantity = 1
  workspaceModal.last_local_activity_at = Date.now()

  await nextTick()

  if (entryQuantityInput.value && typeof entryQuantityInput.value.focus === 'function') {
    entryQuantityInput.value.focus()
  }

  if (entryQuantityInput.value && typeof entryQuantityInput.value.select === 'function') {
    entryQuantityInput.value.select()
  }
}

const submitPendingEntry = async () => {
  const quantity = Number(workspaceModal.entry_quantity || 0)

  if (!workspaceModal.count_id || !workspaceModal.pending_item) {
    showToast('danger', 'Select an item first.')
    return
  }

  if (quantity === 0) {
    showToast('danger', 'Quantity to add cannot be zero.')
    return
  }

  workspaceModal.last_local_activity_at = Date.now()

  try {
    const response = await store.recordEntry(workspaceModal.count_id, {
      product_id: workspaceModal.pending_item.product_id,
      variation_id: workspaceModal.pending_item.variation_id,
      quantity,
      unit_cost: workspaceModal.pending_item.unit_cost,
    })

    hydrateWorkspace(response.data)
    clearPendingItem()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to record the counted quantity.')
  }
}

const submitItemUpdate = async (item) => {
  if (!workspaceModal.count_id) {
    return
  }

  const countedQuantity = Number(item.editable_counted_quantity ?? 0)

  if (countedQuantity < 0) {
    showToast('danger', 'Counted quantity cannot be negative.')
    return
  }

  workspaceModal.last_local_activity_at = Date.now()

  try {
    const response = await store.updateItem(workspaceModal.count_id, item.id, {
      counted_quantity: countedQuantity,
    })

    hydrateWorkspace(response.data)
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to update the counted quantity.')
  }
}

const submitCreate = async () => {
  if (!createForm.warehouse_id) {
    showToast('danger', 'Warehouse is required.')
    return
  }

  try {
    const response = await store.createItem({
      warehouse_id: createForm.warehouse_id,
      date: createForm.date,
      notes: createForm.notes || null,
    })

    closeCreateModal()
    await openWorkspaceModal(response.data.id)
    showToast('success', 'Stock count started successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to start the stock count.')
  }
}

const submitComplete = async () => {
  if (!workspaceModal.count_id) {
    return
  }

  try {
    await store.completeItem(workspaceModal.count_id, {})
    closeWorkspaceModal()
    showToast('success', 'Stock count completed successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to complete the stock count.')
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

onBeforeUnmount(() => {
  stopWorkspacePolling()
})
</script>
