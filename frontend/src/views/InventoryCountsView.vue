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

      <AppModal
        :show="workspaceModal.show"
        :title="isCompletedWorkspace ? 'Completed stock count' : 'Live stock count'"
        icon="count"
        size="xl"
        mobile-full-screen
        @close="closeWorkspaceModal"
      >
        <div class="space-y-5">
          <div v-if="workspaceModal.loading" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading count workspace...</div>

          <template v-else>
            <div class="rounded-[14px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900">
              <section class="border-b border-slate-200 p-4 dark:border-slate-800">
                <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                    <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{{ formatHumanDate(workspaceModal.date) }}</div>
                  </div>
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Mode</div>
                    <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {{ isCompletedWorkspace ? 'Correction mode' : 'Live mode' }}
                    </div>
                  </div>
                </div>
              </section>

              <section class="border-b border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                <div class="font-semibold text-slate-950 dark:text-white">
                  {{ isCompletedWorkspace ? 'Completed counts stay editable.' : 'This count is still open.' }}
                </div>
                <div class="mt-1">
                  {{ isCompletedWorkspace
                    ? 'Any correction after completion posts only the delta adjustment, so mistakes can be fixed without losing the audit trail.'
                    : 'Scan, search, and update quantities. When you complete the count, only the final difference is posted to stock.' }}
                </div>
              </section>

              <section class="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 md:static md:shadow-none">
                <div>
                  <div class="text-sm font-semibold text-slate-950 dark:text-white">
                    {{ isCompletedWorkspace ? 'Add correction lines' : 'Scan or search first' }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    {{ isCompletedWorkspace
                      ? 'You can still scan or search an item after completion. Any new quantity you add is posted as a correction against the already completed count.'
                      : 'Scan or search by lot, serial, SKU, name, or description. After you pick the item, enter the counted quantity and save it into this shared session.' }}
                  </div>
                </div>

                <div class="mt-3">
                  <label class="erp-label">Scan or search item</label>
                  <InventoryProductLookup
                    :warehouse-id="workspaceModal.warehouse?.id || ''"
                    balance-mode="system"
                    :disabled="store.recording || store.completing"
                    :helper-text="isCompletedWorkspace
                      ? 'Completed count corrections still resolve the correct product, lot, or serial before posting the delta.'
                      : 'Lot and serial matches still resolve to the correct product or variant for quantity counting.'"
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
                        <label class="erp-label">{{ isCompletedWorkspace ? 'Correction qty' : 'Qty to add' }}</label>
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
                        <span v-else>{{ isCompletedWorkspace ? 'Post correction' : 'Add count' }}</span>
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
                    {{ isCompletedWorkspace
                      ? 'Repeated saves continue from the current counted total and immediately post only the new delta adjustment.'
                      : 'Repeated saves for the same product or variant are added into the same counted total.' }}
                  </div>
                </div>
              </section>

              <section
                v-if="workspaceModal.items.length > 0"
                class="border-b border-slate-200 p-4 dark:border-slate-800"
              >
              <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-slate-950 dark:text-white">Quick find counted line</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Search counted items by product, variant, SKU, or lot so you can edit without scrolling.
                  </div>
                </div>

                <div class="flex w-full flex-col gap-3 md:w-[26rem] md:flex-row">
                  <div class="relative flex-1">
                    <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
                      <i class="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input
                      v-model.trim="workspaceModal.item_search"
                      type="text"
                      class="erp-input pl-11"
                      placeholder="Search counted items"
                    />
                  </div>
                  <button
                    v-if="workspaceModal.item_search"
                    type="button"
                    class="erp-button-secondary whitespace-nowrap"
                    @click="workspaceModal.item_search = ''"
                  >
                    Clear search
                  </button>
                </div>
              </div>

              <div class="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Showing {{ filteredWorkspaceItems.length }} of {{ workspaceModal.items.length }} counted lines.
              </div>
              </section>

              <section class="p-4">
                <div
                  v-if="workspaceModal.items.length === 0"
                  class="rounded-[10px] border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
                >
                  No counted lines yet. Scan or search an item above to start capturing quantities.
                </div>

                <div
                  v-else-if="filteredWorkspaceItems.length === 0"
                  class="rounded-[10px] border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
                >
                  No counted items match "{{ workspaceModal.item_search }}".
                </div>

                <div v-else class="space-y-3 md:hidden">
                  <div
                    v-for="item in filteredWorkspaceItems"
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
                    <div v-if="item.lot?.lot_number" class="mt-2 inline-flex rounded-[6px] bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/35 dark:text-amber-300">
                      Lot: {{ item.lot.lot_number }}
                    </div>
                  </div>
                    <span class="erp-badge" :class="differenceClass(item.difference)">
                      {{ formatSignedQuantity(item.difference) }}
                    </span>
                </div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-[10px] bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">System qty</div>
                    <div class="mt-1 text-base font-semibold text-slate-950 dark:text-white">{{ formatQuantity(item.system_quantity) }}</div>
                  </div>
                    <div>
                      <label class="erp-label">{{ isCompletedWorkspace ? 'Final counted qty' : 'Counted qty' }}</label>
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
                  <span v-else>{{ isCompletedWorkspace ? 'Save correction' : 'Update counted qty' }}</span>
                </button>
                  </div>
                </div>

                <div v-if="filteredWorkspaceItems.length > 0" class="hidden md:block erp-table-shell">
                  <div class="overflow-x-auto">
                    <table class="erp-table min-w-full">
                      <thead>
                        <tr>
                          <th class="w-[34%]">Product</th>
                          <th class="w-[16%]">SKU</th>
                          <th class="w-[14%]">Lot</th>
                          <th class="w-[14%]">System qty</th>
                          <th class="w-[18%]">Counted qty</th>
                          <th class="w-[12%]">Difference</th>
                          <th class="w-[14%]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in filteredWorkspaceItems" :key="item.id">
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
                            {{ item.lot?.lot_number || '-' }}
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
                            <span class="erp-badge" :class="differenceClass(item.difference)">
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
              </section>

              <section class="border-t border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                {{ isCompletedWorkspace
                  ? 'This count is already completed. Editing a line now posts only the difference between the old counted quantity and the new counted quantity.'
                  : 'Completing the session compares the counted totals above against the snapped system quantities and posts only the difference as stock count correction movements.' }}
              </section>

              <section class="px-4 pb-1 pt-3 md:px-4">
                <div class="erp-form-actions border-t border-slate-200 pt-3 dark:border-slate-800">
                  <button type="button" class="erp-button-secondary" :disabled="store.recording || store.completing" @click="closeWorkspaceModal">Close</button>
                  <button
                    v-if="!isCompletedWorkspace"
                    type="button"
                    class="erp-button-primary"
                    :disabled="store.recording || store.completing"
                    @click="submitComplete"
                  >
                    <span v-if="store.completing" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                    Complete count
                  </button>
                </div>
              </section>
            </div>
          </template>
        </div>
      </AppModal>

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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useInventoryCountsStore, useInventoryOptionsStore } from '@stores/inventory'

const auth = useAuthStore()
const router = useRouter()
const store = useInventoryCountsStore()
const optionsStore = useInventoryOptionsStore()

const canCreate = computed(() => auth.can('inventory.count'))
const canDeleteCount = (row) => canCreate.value && row?.status === 'in_progress'
const isCompletedWorkspace = computed(() => workspaceModal.status === 'completed')
const columns = [
  { key: 'reference', label: 'Reference' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'discrepancies', label: 'Discrepancies' },
  { key: 'actions', label: 'Actions' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const deleteDialog = reactive({ show: false, countId: '', itemName: '' })
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
  item_search: '',
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
  if (status === 'completed') return 'erp-badge-success'
  if (status === 'cancelled') return 'erp-badge-danger'
  return 'erp-badge-warning'
}

const differenceClass = (difference) => {
  const value = Number(difference || 0)

  if (value > 0) {
    return 'erp-badge-success'
  }

  if (value < 0) {
    return 'erp-badge-danger'
  }

  return 'erp-badge-neutral'
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

const filteredWorkspaceItems = computed(() => {
  const term = workspaceModal.item_search.trim().toLowerCase()

  if (!term) {
    return workspaceModal.items
  }

  return workspaceModal.items.filter((item) => {
    const haystack = [
      item.product?.name,
      item.variation?.name,
      item.product?.sku,
      item.variation?.sku,
      item.lot?.lot_number,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
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
  workspaceModal.item_search = ''
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
  router.push({ name: 'inventory-counts-create' })
}

const closeCreateModal = () => {
  createModal.show = false
}

const openWorkspaceModal = async (countId) => {
  router.push({ name: 'inventory-counts-workspace', params: { id: countId } })
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
    lot_id: match.lot_id || null,
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
      lot_id: workspaceModal.pending_item.lot_id,
      quantity,
      unit_cost: workspaceModal.pending_item.unit_cost,
    })

    hydrateWorkspace(response.data)
    clearPendingItem()
    showToast('success', isCompletedWorkspace.value ? 'Correction posted successfully.' : 'Count entry recorded successfully.')
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
    showToast('success', isCompletedWorkspace.value ? 'Count correction saved successfully.' : 'Counted quantity updated successfully.')
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
