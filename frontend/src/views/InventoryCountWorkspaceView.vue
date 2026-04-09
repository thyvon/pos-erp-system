<template>
  <AppLayout :title="pageTitle" :subtitle="pageSubtitle" :breadcrumbs="breadcrumbs">
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <PageBlurSkeleton v-if="isSetupMode && setupLoading" variant="form" />

      <div v-else-if="isSetupMode" class="erp-form-page relative z-0 w-full overflow-visible focus-within:z-20">
        <div class="mb-5">
          <h2 class="text-lg font-semibold text-slate-950 dark:text-white">Count Setup</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose the warehouse and date, then continue into the live count workspace on this same page.
          </p>
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
          <div>
            <label class="erp-label">Warehouse</label>
            <AppSelect
              :model-value="setupForm.warehouse_id || null"
              :options="warehouseOptions"
              searchable
              placeholder="Select warehouse"
              @update:model-value="setupForm.warehouse_id = $event || ''"
            />
          </div>
          <div>
            <label class="erp-label">Date</label>
            <AppDatePicker v-model="setupForm.date" />
          </div>
        </div>

        <div class="mt-4">
          <label class="erp-label">Notes</label>
          <textarea v-model="setupForm.notes" rows="3" class="erp-input"></textarea>
        </div>

        <div class="mt-6 erp-form-actions">
          <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="goBack">
            Cancel
          </button>
          <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitCreate">
            <span v-if="store.saving" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
            Start count
          </button>
        </div>
      </div>

      <div v-else-if="workspace.loading" class="erp-form-page py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading count workspace...
      </div>

      <template v-else>
        <div class="erp-form-page p-4">
          <div class="mb-4 flex flex-wrap justify-end gap-2">
            <button
              v-if="canDeleteCount"
              type="button"
              class="erp-button-secondary border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/20"
              :disabled="isDeletingCount || manualRefreshing || workspace.loading || store.workspaceItemsLoading || store.recording || store.completing"
              @click="handleDeleteCount"
            >
              <span
                v-if="isDeletingCount"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-300/30 border-t-rose-700 dark:border-rose-500/30 dark:border-t-rose-200"
              ></span>
              <span v-else>Delete count</span>
            </button>
            <button
              type="button"
              class="erp-button-secondary"
              :disabled="isDeletingCount || manualRefreshing || workspace.loading || store.workspaceItemsLoading || store.recording || store.completing"
              @click="handleManualRefresh"
            >
              <span
                v-if="manualRefreshing"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-700 dark:border-slate-500/30 dark:border-t-slate-200"
              ></span>
              <span v-else>Refresh</span>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reference</div>
              <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{{ workspace.reference_no || 'Pending' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Warehouse</div>
              <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{{ workspace.warehouse?.name || 'Unknown warehouse' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Date</div>
              <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{{ formatHumanDate(workspace.date) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Mode</div>
              <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {{ isCompletedWorkspace ? 'Read-only review' : 'Live mode' }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!isCompletedWorkspace"
          class="erp-form-page sticky top-16 z-10 overflow-visible px-4 py-4 focus-within:z-30"
        >
          <div>
            <label class="erp-label">Scan or search item</label>
            <InventoryProductLookup
              :warehouse-id="workspace.warehouse?.id || ''"
              balance-mode="system"
              :disabled="store.recording || store.completing"
              helper-text="Lot and serial matches still resolve to the correct product or variant for quantity counting."
              @select="handleLookupSelect"
            />
          </div>

          <div
            v-if="workspace.pending_item"
            class="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-800"
          >
            <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div class="min-w-0">
                <div class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Selected item</div>
                <div class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                  {{ workspace.pending_item.product_name || 'Selected item' }}
                  <span v-if="workspace.pending_item.variation_name" class="text-slate-500 dark:text-slate-400">/ {{ workspace.pending_item.variation_name }}</span>
                </div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {{ workspace.pending_item.sku || 'No SKU' }}
                </div>
                <div class="mt-2 inline-flex rounded-[8px] bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300">
                  Ending qty: {{ formatQuantity(workspace.pending_item.ending_quantity) }}
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-[minmax(0,180px)_auto_auto] sm:items-end">
                <div>
                  <label class="erp-label">Qty to add</label>
                  <input
                    ref="entryQuantityInput"
                    v-model.number="workspace.entry_quantity"
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

        <div v-if="showWorkspaceTableShell" class="erp-table-shell">
          <div class="erp-table-header">
            <div>
              <h2 class="text-lg font-semibold text-slate-950 dark:text-white">Counted Lines</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {{ workspaceItemPagination.total }} total counted lines
              </p>
            </div>

            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div class="w-full sm:w-72">
                <SearchInput v-model="workspace.item_search" placeholder="Search counted items" />
              </div>
            </div>
          </div>

          <div class="relative">
            <div v-if="showWorkspaceRefreshingState" class="erp-workspace-table-refresh-chip" aria-live="polite">
              <span class="erp-workspace-table-refresh-chip__dot"></span>
              <span class="erp-workspace-table-refresh-chip__label">Refreshing</span>
            </div>

            <div v-if="showWorkspaceRefreshingState" class="erp-workspace-table-refresh-bar" aria-hidden="true">
              <span></span>
            </div>

            <div v-if="showWorkspaceSkeletonRows" class="space-y-3 p-4 md:hidden">
              <div
                v-for="rowIndex in workspaceSkeletonRowCount"
                :key="`workspace-mobile-skeleton-${rowIndex}`"
                class="erp-preview-card animate-pulse"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-2">
                    <div class="h-4 rounded-full bg-slate-200/90 dark:bg-slate-700/80" style="width: 68%"></div>
                    <div class="h-3 rounded-full bg-slate-200/75 dark:bg-slate-700/60" style="width: 40%"></div>
                  </div>
                  <div class="h-6 rounded-full bg-slate-200/85 dark:bg-slate-700/75" style="width: 4.5rem"></div>
                </div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div class="erp-preview-tile px-3 py-2">
                    <div class="h-3 rounded-full bg-slate-200/80 dark:bg-slate-700/70" style="width: 48%"></div>
                    <div class="mt-2 h-4 rounded-full bg-slate-200/90 dark:bg-slate-700/80" style="width: 58%"></div>
                  </div>
                  <div>
                    <div class="mb-2 h-3 rounded-full bg-slate-200/80 dark:bg-slate-700/70" style="width: 42%"></div>
                    <div class="h-12 rounded-[16px] bg-slate-200/90 dark:bg-slate-700/80"></div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else-if="!store.workspaceItemsLoading && workspaceItemPagination.total === 0 && !workspace.item_search"
              class="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              No counted lines yet. Scan or search an item above to start capturing quantities.
            </div>

            <div
              v-else-if="!store.workspaceItemsLoading && workspaceItemPagination.total === 0 && workspace.item_search"
              class="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              No counted items match "{{ workspace.item_search }}".
            </div>

            <div v-else class="space-y-3 p-4 md:hidden">
              <div
                v-for="item in workspace.items"
                :key="item.id"
                class="erp-preview-card"
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
              <div class="erp-preview-tile px-3 py-2">
                <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">System qty</div>
                <div class="mt-1 text-base font-semibold text-slate-950 dark:text-white">{{ formatQuantity(item.system_quantity) }}</div>
              </div>
              <div>
                <label class="erp-label">Counted qty</label>
                <div
                  v-if="isCompletedWorkspace"
                  class="erp-preview-tile flex h-12 items-center px-3 text-lg font-semibold text-slate-950 dark:text-white"
                >
                  {{ formatQuantity(item.counted_quantity) }}
                </div>
                <input
                  v-else
                  v-model.number="item.editable_counted_quantity"
                  type="number"
                  min="0"
                  step="0.0001"
                  class="erp-input h-12 text-lg font-semibold"
                  :disabled="store.recording || store.completing || isUpdatingItem(item.id)"
                  @focus="workspace.last_local_activity_at = Date.now()"
                  @keydown.enter.prevent="submitItemUpdate(item)"
                />
              </div>
            </div>

            <div v-if="!isCompletedWorkspace" class="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                class="erp-button-secondary inline-flex h-10 w-10 items-center justify-center p-0"
                title="Update counted quantity"
                aria-label="Update counted quantity"
                :disabled="store.recording || store.completing || !hasItemChanged(item) || isUpdatingItem(item.id)"
                @click="submitItemUpdate(item)"
              >
                <span v-if="isUpdatingItem(item.id)" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-700 dark:border-slate-500/30 dark:border-t-slate-200"></span>
                <template v-else>
                  <i class="fa-solid fa-floppy-disk"></i>
                  <span class="sr-only">Update counted quantity</span>
                </template>
              </button>
              <button
                type="button"
                class="erp-button-secondary inline-flex h-10 w-10 items-center justify-center border-rose-200 p-0 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/20"
                title="Remove counted line"
                aria-label="Remove counted line"
                :disabled="store.recording || store.completing || isUpdatingItem(item.id)"
                @click="removeItem(item)"
              >
                <span v-if="isUpdatingItem(item.id)" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-300/30 border-t-rose-700 dark:border-rose-500/30 dark:border-t-rose-200"></span>
                <template v-else>
                  <i class="fa-solid fa-trash-can"></i>
                  <span class="sr-only">Remove counted line</span>
                </template>
              </button>
            </div>
          </div>
            </div>

            <div v-if="showWorkspaceSkeletonRows" class="hidden md:block overflow-x-auto">
            <table class="erp-table min-w-full">
              <thead>
                <tr>
                  <th class="w-[34%]">Product</th>
                  <th class="w-[16%]">SKU</th>
                  <th class="w-[14%]">Lot</th>
                  <th class="w-[14%]">System qty</th>
                  <th class="w-[18%]">Counted qty</th>
                  <th class="w-[12%]">Difference</th>
                  <th v-if="!isCompletedWorkspace" class="w-[18%]">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rowIndex in workspaceSkeletonRowCount" :key="`workspace-skeleton-${rowIndex}`" class="erp-workspace-table-skeleton-row">
                  <td v-for="columnKey in ['product', 'sku', 'lot', 'system', 'counted', 'difference', ...(!isCompletedWorkspace ? ['action'] : [])]" :key="`${rowIndex}-${columnKey}`">
                    <span class="erp-workspace-table-skeleton-cell" :style="getWorkspaceSkeletonCellStyle(rowIndex, columnKey)"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

            <div v-else-if="workspace.items.length > 0" class="hidden md:block overflow-x-auto">
            <table class="erp-table min-w-full">
              <thead>
                <tr>
                  <th class="w-[34%]">Product</th>
                  <th class="w-[16%]">SKU</th>
                  <th class="w-[14%]">Lot</th>
                  <th class="w-[14%]">System qty</th>
                  <th class="w-[18%]">Counted qty</th>
                  <th class="w-[12%]">Difference</th>
                  <th v-if="!isCompletedWorkspace" class="w-[18%]">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in workspace.items" :key="item.id">
                  <td>
                    <div class="font-semibold text-slate-950 dark:text-white">
                      {{ item.product?.name || 'Unknown product' }}
                      <span v-if="item.variation?.name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation.name }}</span>
                    </div>
                  </td>
                  <td class="text-sm text-slate-600 dark:text-slate-300">{{ item.variation?.sku || item.product?.sku || 'No SKU' }}</td>
                  <td class="text-sm text-slate-600 dark:text-slate-300">{{ item.lot?.lot_number || '-' }}</td>
                  <td class="text-sm text-slate-600 dark:text-slate-300">{{ formatQuantity(item.system_quantity) }}</td>
                  <td>
                    <div
                      v-if="isCompletedWorkspace"
                      class="text-sm font-semibold text-slate-950 dark:text-white"
                    >
                      {{ formatQuantity(item.counted_quantity) }}
                    </div>
                    <input
                      v-else
                      v-model.number="item.editable_counted_quantity"
                      type="number"
                      min="0"
                      step="0.0001"
                      class="erp-input"
                      :disabled="store.recording || store.completing || isUpdatingItem(item.id)"
                      @focus="workspace.last_local_activity_at = Date.now()"
                      @keydown.enter.prevent="submitItemUpdate(item)"
                    />
                  </td>
                  <td>
                    <span class="erp-badge" :class="differenceClass(item.difference)">
                      {{ formatSignedQuantity(item.difference) }}
                    </span>
                  </td>
                  <td v-if="!isCompletedWorkspace">
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="erp-button-secondary inline-flex h-10 w-10 items-center justify-center p-0"
                        title="Update counted quantity"
                        aria-label="Update counted quantity"
                        :disabled="store.recording || store.completing || !hasItemChanged(item) || isUpdatingItem(item.id)"
                        @click="submitItemUpdate(item)"
                      >
                        <span v-if="isUpdatingItem(item.id)" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-700 dark:border-slate-500/30 dark:border-t-slate-200"></span>
                        <template v-else>
                          <i class="fa-solid fa-floppy-disk"></i>
                          <span class="sr-only">Update counted quantity</span>
                        </template>
                      </button>
                      <button
                        type="button"
                        class="erp-button-secondary inline-flex h-10 w-10 items-center justify-center border-rose-200 p-0 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/20"
                        title="Remove counted line"
                        aria-label="Remove counted line"
                        :disabled="store.recording || store.completing || isUpdatingItem(item.id)"
                        @click="removeItem(item)"
                      >
                        <span v-if="isUpdatingItem(item.id)" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-300/30 border-t-rose-700 dark:border-rose-500/30 dark:border-t-rose-200"></span>
                        <template v-else>
                          <i class="fa-solid fa-trash-can"></i>
                          <span class="sr-only">Remove counted line</span>
                        </template>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
          <div class="flex flex-col gap-3 border-t border-slate-200/70 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-col gap-2.5 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center">
              <span>Page {{ workspaceItemPagination.current_page }} of {{ workspaceItemPagination.last_page }}</span>
              <label class="flex items-center gap-2">
                <span>Rows</span>
                <select
                  class="erp-select max-w-[5.5rem] py-2"
                  :value="workspaceItemPagination.per_page"
                  @change="handleWorkspacePerPageChange(Number($event.target.value || 25))"
                >
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </label>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="erp-button-secondary"
                :disabled="store.workspaceItemsLoading || workspaceItemPagination.current_page <= 1"
                @click="handleWorkspacePageChange(workspaceItemPagination.current_page - 1)"
              >
                Previous
              </button>
              <span class="text-sm text-slate-600 dark:text-slate-300">
                {{ workspaceItemPagination.from || 0 }}-{{ workspaceItemPagination.to || 0 }} of {{ workspaceItemPagination.total }}
              </span>
              <button
                type="button"
                class="erp-button-secondary"
                :disabled="store.workspaceItemsLoading || workspaceItemPagination.current_page >= workspaceItemPagination.last_page"
                @click="handleWorkspacePageChange(workspaceItemPagination.current_page + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-200 px-4 pt-4 dark:border-slate-800">
          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.recording || store.completing" @click="goBack">
              Back to counts
            </button>
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
        </div>
      </template>

      <ConfirmDelete
        :show="deleteDialog.show"
        :item-name="deleteDialog.itemName"
        :loading="deleteDialogLoading"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import PageBlurSkeleton from '@components/ui/PageBlurSkeleton.vue'
import SearchInput from '@components/ui/SearchInput.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { formatHumanDate } from '@/utils/date'
import { useAuthStore } from '@stores/auth'
import { useInventoryCountsStore, useInventoryOptionsStore } from '@stores/inventory'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useInventoryCountsStore()
const optionsStore = useInventoryOptionsStore()

const isSetupMode = computed(() => !route.params.id)

const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Inventory' },
  { label: 'Counts', to: '/inventory/counts' },
  { label: isSetupMode.value ? 'Start Count' : `Count ${workspace.reference_no || route.params.id}` },
])

const pageTitle = computed(() => {
  if (isSetupMode.value) {
    return 'Start Stock Count'
  }

  return isCompletedWorkspace.value ? 'Completed Stock Count' : 'Live Stock Count'
})
const pageSubtitle = computed(() =>
  isSetupMode.value
    ? 'Create the count session and continue directly into the live workspace on the same page.'
    : (isCompletedWorkspace.value
        ? 'Review the completed count and counted lines.'
        : 'Capture live counted quantities and reconcile stock when the session is complete.')
)

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const entryQuantityInput = ref(null)
const workspaceSearchTimer = ref(null)
const manualRefreshing = ref(false)
const setupLoading = ref(true)
const deleteDialog = reactive({
  show: false,
  mode: '',
  itemId: '',
  itemName: '',
})
const setupForm = reactive({
  warehouse_id: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
})
const workspace = reactive({
  loading: true,
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

const isCompletedWorkspace = computed(() => workspace.status === 'completed')
const warehouseOptions = computed(() =>
  optionsStore.warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.branch_name || warehouse.code,
  }))
)
const workspaceItemPagination = computed(() => store.workspaceItemPagination)
const isDeletingCount = computed(() => store.deletingCountId === workspace.count_id)
const canDeleteCount = computed(() =>
  Boolean(workspace.count_id) && workspace.status === 'in_progress' && auth.can('inventory.count')
)
const deleteDialogLoading = computed(() =>
  deleteDialog.mode === 'count'
    ? isDeletingCount.value
    : isUpdatingItem(deleteDialog.itemId)
)
const showWorkspaceTableShell = computed(() =>
  store.workspaceItemsLoading || workspaceItemPagination.value.total > 0 || workspace.item_search.trim() !== ''
)
const workspaceSkeletonWidths = ['92%', '76%', '58%', '66%', '84%', '62%']
const workspaceSkeletonRowCount = computed(() => Math.max(4, Math.min(workspaceItemPagination.value.per_page || 6, 6)))
const showWorkspaceSkeletonRows = computed(() => store.workspaceItemsLoading && workspace.items.length === 0)
const showWorkspaceRefreshingState = computed(() => store.workspaceItemsLoading && workspace.items.length > 0)
const isUpdatingItem = (itemId) => store.updatingItemId === itemId
const hasItemChanged = (item) => Number(item.editable_counted_quantity ?? 0) !== Number(item.counted_quantity ?? 0)

const getWorkspaceSkeletonCellStyle = (rowIndex, columnKey) => {
  const seed = `${columnKey}-${rowIndex}`
  let total = 0

  for (let index = 0; index < seed.length; index += 1) {
    total += seed.charCodeAt(index)
  }

  return {
    width: workspaceSkeletonWidths[total % workspaceSkeletonWidths.length],
  }
}

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const formatQuantity = (value) => Number(value || 0).toFixed(4)
const formatSignedQuantity = (value) => {
  const number = Number(value || 0)
  return `${number > 0 ? '+' : ''}${number.toFixed(4)}`
}

const differenceClass = (difference) => {
  const value = Number(difference || 0)

  if (value > 0) return 'erp-badge-success'
  if (value < 0) return 'erp-badge-danger'
  return 'erp-badge-neutral'
}

const waitForMinimumLoading = async (startedAt, minimumMs = 320) => {
  const elapsed = Date.now() - startedAt

  if (elapsed < minimumMs) {
    await new Promise((resolve) => window.setTimeout(resolve, minimumMs - elapsed))
  }
}

const resetWorkspace = () => {
  workspace.loading = true
  workspace.count_id = ''
  workspace.reference_no = ''
  workspace.warehouse = null
  workspace.date = ''
  workspace.notes = ''
  workspace.status = ''
  workspace.entry_quantity = 1
  workspace.pending_item = null
  workspace.items = []
  workspace.item_search = ''
  workspace.last_local_activity_at = 0
  store.resetWorkspaceItems()
}

const resetSetupForm = () => {
  setupForm.warehouse_id = ''
  setupForm.date = new Date().toISOString().slice(0, 10)
  setupForm.notes = ''
}

const hydrateWorkspace = (count) => {
  workspace.count_id = count.id
  workspace.reference_no = count.reference_no
  workspace.warehouse = count.warehouse || null
  workspace.date = count.date || ''
  workspace.notes = count.notes || ''
  workspace.status = count.status || ''
  workspace.loading = false
}

const hydrateWorkspaceItems = (items = []) => {
  workspace.items = items.map((item) => ({
    ...item,
    editable_counted_quantity: Number(item.counted_quantity ?? 0),
  }))
}

const stopWorkspacePolling = () => {
  if (workspaceRefreshTimer) {
    window.clearInterval(workspaceRefreshTimer)
    workspaceRefreshTimer = null
  }
}

const refreshWorkspace = async (countId = workspace.count_id, showLoader = false) => {
  if (!countId) {
    return
  }

  if (showLoader) {
    workspace.loading = true
  }

  const count = await store.fetchItem(countId)
  hydrateWorkspace(count)

  if (count.status === 'completed') {
    stopWorkspacePolling()
  }
}

const refreshWorkspaceItems = async (countId = workspace.count_id, overrides = {}) => {
  if (!countId) {
    return
  }

  const response = await store.fetchWorkspaceItems(countId, overrides)
  hydrateWorkspaceItems(response.data)
}

const startWorkspacePolling = () => {
  stopWorkspacePolling()

  if (isCompletedWorkspace.value) {
    return
  }

  workspaceRefreshTimer = window.setInterval(async () => {
    if (!workspace.count_id || store.recording || store.completing) {
      return
    }

    if (Date.now() - workspace.last_local_activity_at < 2000) {
      return
    }

    try {
      await refreshWorkspace(workspace.count_id, false)
      await refreshWorkspaceItems(workspace.count_id)
    } catch {
      // Keep polling silent; user-facing errors still surface on direct actions.
    }
  }, 10000)
}

const goBack = () => {
  router.push({ name: 'inventory-counts' })
}

const submitCreate = async () => {
  if (!setupForm.warehouse_id) {
    showToast('danger', 'Warehouse is required.')
    return
  }

  try {
    const response = await store.createItem({
      warehouse_id: setupForm.warehouse_id,
      date: setupForm.date,
      notes: setupForm.notes || null,
    })

    await router.replace({ name: 'inventory-counts-workspace', params: { id: response.data.id } })
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to start the stock count.')
  }
}

const loadWorkspace = async (countId) => {
  stopWorkspacePolling()
  resetWorkspace()

  if (!countId) {
    const startedAt = Date.now()
    setupLoading.value = true
    resetSetupForm()

    try {
      await optionsStore.fetchOptions()
    } finally {
      await waitForMinimumLoading(startedAt)
      setupLoading.value = false
      workspace.loading = false
    }

    return
  }

  setupLoading.value = false

  try {
    await Promise.all([
      refreshWorkspace(countId, true),
      refreshWorkspaceItems(countId, { search: '', page: 1, per_page: store.workspaceItemFilters.per_page || 25 }),
    ])

    if (!isCompletedWorkspace.value) {
      startWorkspacePolling()
    }
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to open the stock count workspace.')
    goBack()
  }
}

const clearPendingItem = () => {
  workspace.pending_item = null
  workspace.entry_quantity = 1
}

const handleWorkspacePageChange = async (page) => {
  if (!workspace.count_id) {
    return
  }

  await refreshWorkspaceItems(workspace.count_id, { page })
}

const handleWorkspacePerPageChange = async (perPage) => {
  if (!workspace.count_id) {
    return
  }

  await refreshWorkspaceItems(workspace.count_id, { per_page: perPage, page: 1 })
}

const handleManualRefresh = async () => {
  if (!workspace.count_id || manualRefreshing.value) {
    return
  }

  manualRefreshing.value = true

  try {
    await Promise.all([
      refreshWorkspace(workspace.count_id),
      refreshWorkspaceItems(workspace.count_id),
    ])
  } finally {
    manualRefreshing.value = false
  }
}

const handleDeleteCount = async () => {
  if (!workspace.count_id || !canDeleteCount.value || isDeletingCount.value) {
    return
  }

  deleteDialog.mode = 'count'
  deleteDialog.itemId = workspace.count_id
  deleteDialog.itemName = workspace.reference_no || 'this stock count'
  deleteDialog.show = true
}

const closeDeleteModal = () => {
  if (deleteDialogLoading.value) {
    return
  }

  deleteDialog.show = false
  deleteDialog.mode = ''
  deleteDialog.itemId = ''
  deleteDialog.itemName = ''
}

const confirmDelete = async () => {
  if (!deleteDialog.show) {
    return
  }

  if (deleteDialog.mode === 'count') {
    stopWorkspacePolling()

    try {
      await store.deleteCount(workspace.count_id)
      const label = deleteDialog.itemName
      closeDeleteModal()
      showToast('success', `Stock count ${label} deleted successfully.`)
      goBack()
    } catch (error) {
      if (!isCompletedWorkspace.value) {
        startWorkspacePolling()
      }

      showToast('danger', error.response?.data?.message || 'Unable to delete the stock count.')
    }

    return
  }

  const item = workspace.items.find((entry) => String(entry.id) === String(deleteDialog.itemId))

  if (!item || !workspace.count_id || isCompletedWorkspace.value) {
    closeDeleteModal()
    return
  }

  workspace.last_local_activity_at = Date.now()

  try {
    await store.deleteItem(workspace.count_id, item.id)

    await Promise.all([
      refreshWorkspace(workspace.count_id),
      refreshWorkspaceItems(workspace.count_id),
    ])

    if (workspace.pending_item && workspace.pending_item.product_id === item.product_id && (workspace.pending_item.variation_id || null) === (item.variation_id || null)) {
      clearPendingItem()
    }

    closeDeleteModal()
    showToast('success', 'Counted line removed successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to remove the counted line.')
  }
}

const handleLookupSelect = async (match) => {
  if (!workspace.count_id) {
    showToast('danger', 'Open a stock count session first.')
    return
  }

  workspace.pending_item = {
    product_id: match.product_id,
    variation_id: match.variation_id || null,
    lot_id: match.lot_id || null,
    product_name: match.product_name || '',
    variation_name: match.variation_name || '',
    sku: match.sku || '',
    ending_quantity: Number(match.ending_quantity || 0),
    unit_cost: Number(match.unit_cost || 0),
  }
  workspace.entry_quantity = 1
  workspace.last_local_activity_at = Date.now()

  await nextTick()

  if (entryQuantityInput.value && typeof entryQuantityInput.value.focus === 'function') {
    entryQuantityInput.value.focus()
  }

  if (entryQuantityInput.value && typeof entryQuantityInput.value.select === 'function') {
    entryQuantityInput.value.select()
  }
}

const submitPendingEntry = async () => {
  const quantity = Number(workspace.entry_quantity || 0)

  if (!workspace.count_id || !workspace.pending_item) {
    showToast('danger', 'Select an item first.')
    return
  }

  if (quantity === 0) {
    showToast('danger', 'Quantity to add cannot be zero.')
    return
  }

  workspace.last_local_activity_at = Date.now()

  try {
    await store.recordEntry(workspace.count_id, {
      product_id: workspace.pending_item.product_id,
      variation_id: workspace.pending_item.variation_id,
      lot_id: workspace.pending_item.lot_id,
      quantity,
      unit_cost: workspace.pending_item.unit_cost,
    })

    await Promise.all([
      refreshWorkspace(workspace.count_id),
      refreshWorkspaceItems(workspace.count_id),
    ])
    clearPendingItem()
    showToast('success', isCompletedWorkspace.value ? 'Correction posted successfully.' : 'Count entry recorded successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to record the counted quantity.')
  }
}

const submitItemUpdate = async (item) => {
  if (!workspace.count_id) {
    return
  }

  const countedQuantity = Number(item.editable_counted_quantity ?? 0)

  if (countedQuantity < 0) {
    showToast('danger', 'Counted quantity cannot be negative.')
    return
  }

  workspace.last_local_activity_at = Date.now()

  try {
    await store.updateItem(workspace.count_id, item.id, {
      counted_quantity: countedQuantity,
    })

    await Promise.all([
      refreshWorkspace(workspace.count_id),
      refreshWorkspaceItems(workspace.count_id),
    ])
    showToast('success', isCompletedWorkspace.value ? 'Count correction saved successfully.' : 'Counted quantity updated successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to update the counted quantity.')
  }
}

const removeItem = async (item) => {
  if (!workspace.count_id || isCompletedWorkspace.value) {
    return
  }

  deleteDialog.mode = 'item'
  deleteDialog.itemId = item.id
  deleteDialog.itemName = item.variation?.name
    ? `${item.product?.name || 'Unknown product'} / ${item.variation.name}`
    : (item.product?.name || 'Unknown product')
  deleteDialog.show = true
}

const submitComplete = async () => {
  if (!workspace.count_id) {
    return
  }

  try {
    await store.completeItem(workspace.count_id, {})
    await Promise.all([
      refreshWorkspace(workspace.count_id, true),
      refreshWorkspaceItems(workspace.count_id),
    ])
    stopWorkspacePolling()
    showToast('success', 'Stock count completed successfully.')
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to complete the stock count.')
  }
}

watch(() => route.params.id, (countId) => {
  loadWorkspace(countId)
}, { immediate: true })

watch(() => workspace.item_search, (value) => {
  if (!workspace.count_id) {
    return
  }

  if (workspaceSearchTimer.value) {
    window.clearTimeout(workspaceSearchTimer.value)
  }

  workspaceSearchTimer.value = window.setTimeout(() => {
    refreshWorkspaceItems(workspace.count_id, { search: value.trim(), page: 1 })
  }, 250)
})

onBeforeUnmount(() => {
  stopWorkspacePolling()

  if (workspaceSearchTimer.value) {
    window.clearTimeout(workspaceSearchTimer.value)
    workspaceSearchTimer.value = null
  }
})

onMounted(async () => {
  if (!isSetupMode.value && optionsStore.warehouses.length === 0) {
    await optionsStore.fetchOptions()
  }
})
</script>

<style scoped>
.erp-workspace-table-skeleton-row td {
  padding-top: 0.95rem;
  padding-bottom: 0.95rem;
}

.erp-workspace-table-skeleton-cell {
  position: relative;
  display: block;
  min-width: 3.5rem;
  height: 0.78rem;
  overflow: hidden;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.92), rgba(241, 245, 249, 0.98));
}

.erp-workspace-table-skeleton-cell::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.78), transparent);
  animation: erp-workspace-table-shimmer 1.2s ease-in-out infinite;
}

.erp-workspace-table-refresh-chip {
  position: absolute;
  top: 0.9rem;
  right: 1rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.72rem;
  border: 1px solid rgba(191, 219, 254, 0.9);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.14);
}

.erp-workspace-table-refresh-chip__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: #2563eb;
  box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.24);
  animation: erp-workspace-table-pulse 1.2s ease-in-out infinite;
}

.erp-workspace-table-refresh-chip__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #334155;
}

.erp-workspace-table-refresh-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  height: 2px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.14);
}

.erp-workspace-table-refresh-bar > span {
  position: absolute;
  inset: 0 auto 0 0;
  width: 28%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  animation: erp-workspace-table-slide 1.15s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.dark .erp-workspace-table-skeleton-cell {
  background: linear-gradient(90deg, rgba(51, 65, 85, 0.94), rgba(71, 85, 105, 0.88));
}

.dark .erp-workspace-table-refresh-chip {
  border-color: rgba(59, 130, 246, 0.28);
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.24);
}

.dark .erp-workspace-table-refresh-chip__dot {
  background: #38bdf8;
  box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.2);
}

.dark .erp-workspace-table-refresh-chip__label {
  color: #cbd5e1;
}

.dark .erp-workspace-table-refresh-bar {
  background: rgba(51, 65, 85, 0.45);
}

@keyframes erp-workspace-table-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes erp-workspace-table-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.2);
  }

  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 7px rgba(37, 99, 235, 0);
  }
}

@keyframes erp-workspace-table-slide {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(360%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .erp-workspace-table-skeleton-cell::after,
  .erp-workspace-table-refresh-chip__dot,
  .erp-workspace-table-refresh-bar > span {
    animation: none;
  }
}
</style>
