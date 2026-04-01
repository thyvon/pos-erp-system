<template>
  <AppLayout
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :breadcrumbs="breadcrumbs"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <div
        v-if="loadError"
        class="rounded-[5px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
      >
        <div class="font-semibold">Unable to load the transfer form.</div>
        <div class="mt-1">{{ loadError }}</div>
      </div>

      <PageBlurSkeleton v-else-if="loading" variant="form" />

      <div v-else class="space-y-6">
        <section class="rounded-[10px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-950 dark:text-white">
                {{ isEditMode ? 'Transfer Document' : 'Transfer Setup' }}
              </h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {{ isEditMode
                  ? 'Update the transfer while it is still pending or already in transit but not yet received.'
                  : 'Create a transfer document with the source, destination, and scanned transfer lines.' }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 self-start">
              <div
                v-if="isEditMode && transfer"
                class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <i class="fa-solid fa-file-lines"></i>
                {{ transfer.reference_no }}
              </div>
              <div
                v-if="isEditMode && transfer"
                class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize"
                :class="statusClasses(transfer.status)"
              >
                <i class="fa-solid fa-arrow-right-arrow-left"></i>
                {{ statusLabel(transfer.status) }}
              </div>
            </div>
          </div>

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

          <div class="mt-4">
            <label class="erp-label">Notes</label>
            <textarea v-model="form.notes" rows="3" class="erp-input"></textarea>
          </div>
        </section>

        <section class="rounded-[10px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="space-y-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-950 dark:text-white">Transfer items</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Scan or search against the source warehouse, then add or adjust the transfer lines below.
              </p>
            </div>

            <InventoryProductLookup
              :warehouse-id="form.from_warehouse_id"
              :helper-text="form.from_warehouse_id ? 'Serial and lot matches are scoped to the source warehouse.' : 'Choose the source warehouse first for scanner-aware matches.'"
              @select="handleLookupSelect"
            />
          </div>

          <div
            v-if="form.items.length === 0"
            class="mt-4 rounded-[5px] border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
          >
            No lines yet. Scan or search a product above to start.
          </div>

          <div v-else class="mt-4 erp-table-shell">
            <div class="erp-table-header">
              <div>
                <h3 class="text-base font-semibold text-slate-950 dark:text-white">Transfer lines</h3>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ form.items.length }} total lines
                </p>
              </div>

              <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div class="w-full sm:w-72">
                  <SearchInput v-model="form.item_search" placeholder="Search transfer items" />
                </div>
              </div>
            </div>

            <div
              v-if="filteredItems.length === 0"
              class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              No transfer items match "{{ form.item_search }}".
            </div>

            <div v-else class="overflow-x-auto">
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
                  <tr v-for="item in filteredItems" :key="item.key">
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
                      <button type="button" class="erp-button-secondary w-full" @click="removeItemByKey(item.key)">Remove</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div class="erp-form-actions">
          <button type="button" class="erp-button-secondary" :disabled="isSaving" @click="goBack">
            Cancel
          </button>
          <button
            type="button"
            :class="showSaveAndSend ? 'erp-button-secondary' : 'erp-button-primary'"
            :disabled="isSaving"
            @click="submitForm(false)"
          >
            <span
              v-if="isSaving && !submitModeSend"
              class="inline-block h-4 w-4 animate-spin rounded-full border-2"
              :class="showSaveAndSend ? 'border-slate-400/30 border-t-slate-700 dark:border-slate-500/30 dark:border-t-slate-100' : 'border-white/30 border-t-white'"
            ></span>
            {{ primarySaveLabel }}
          </button>
          <button
            v-if="showSaveAndSend"
            type="button"
            class="erp-button-primary"
            :disabled="isSaving"
            @click="submitForm(true)"
          >
            <span v-if="isSaving && submitModeSend" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
            {{ sendButtonLabel }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import PageBlurSkeleton from '@components/ui/PageBlurSkeleton.vue'
import SearchInput from '@components/ui/SearchInput.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useInventoryOptionsStore, useInventoryTransfersStore } from '@stores/inventory'
import {
  getStockTransferStatusClasses,
  getStockTransferStatusLabel,
  isStockTransferInTransit,
  isStockTransferPending,
} from '../utils/stockTransferStatus'

const route = useRoute()
const router = useRouter()
const store = useInventoryTransfersStore()
const optionsStore = useInventoryOptionsStore()

const transfer = ref(null)
const loading = ref(true)
const loadError = ref('')
const submitModeSend = ref(false)
const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })

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
  item_search: '',
  items: [],
})

const isEditMode = computed(() => Boolean(route.params.id))
const isSaving = computed(() => isEditMode.value ? store.updatingId === route.params.id : store.saving)
const showSaveAndSend = computed(() => !isEditMode.value || isStockTransferPending(transfer.value?.status))
const primarySaveLabel = computed(() => {
  if (!isEditMode.value) return 'Save'
  return isStockTransferInTransit(transfer.value?.status) ? 'Save changes' : 'Save'
})
const sendButtonLabel = computed(() => {
  if (!isEditMode.value) return 'Save and Send'
  return isStockTransferPending(transfer.value?.status) ? 'Save and Send' : 'Send'
})

const pageTitle = computed(() => isEditMode.value ? 'Edit Stock Transfer' : 'Create Stock Transfer')
const pageSubtitle = computed(() =>
  isEditMode.value
    ? 'Keep the transfer editable until receipt. Pending stays internal, in transit becomes visible to the destination side.'
    : 'Create a stock transfer document on a dedicated form page for safer review and editing.'
)
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Inventory' },
  { label: 'Transfers', to: '/inventory/transfers' },
  { label: isEditMode.value && transfer.value ? transfer.value.reference_no : (isEditMode.value ? 'Edit transfer' : 'New transfer') },
])

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

const waitForMinimumLoading = async (startedAt, minimumMs = 320) => {
  const elapsed = Date.now() - startedAt

  if (elapsed < minimumMs) {
    await new Promise((resolve) => window.setTimeout(resolve, minimumMs - elapsed))
  }
}

const resetForm = () => {
  form.from_warehouse_id = ''
  form.to_warehouse_id = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.notes = ''
  form.item_search = ''
  form.items = []
}

const populateForm = () => {
  if (!transfer.value) return

  form.from_warehouse_id = transfer.value.from_warehouse_id || ''
  form.to_warehouse_id = transfer.value.to_warehouse_id || ''
  form.date = transfer.value.date || new Date().toISOString().slice(0, 10)
  form.notes = transfer.value.notes || ''
  form.item_search = ''
  form.items = (transfer.value.items || []).map((item) => ({
    ...createItemState(),
    product_id: item.product_id,
    variation_id: item.variation_id || '',
    lot_id: item.lot_id || '',
    serial_id: item.serial_id || '',
    product_name: item.product?.name || '',
    variation_name: item.variation?.name || '',
    sku: item.variation?.sku || item.product?.sku || '',
    lot_number: item.lot?.lot_number || '',
    serial_number: item.serial?.serial_number || '',
    quantity: Number(item.quantity || 0),
    unit_cost: Number(item.unit_cost || 0),
  }))
}

const removeItemByKey = (key) => {
  const index = form.items.findIndex((item) => item.key === key)

  if (index !== -1) {
    form.items.splice(index, 1)
  }
}

const matchesItemSearch = (item, search) => {
  const keyword = search.trim().toLowerCase()

  if (!keyword) {
    return true
  }

  return [
    item.product_name,
    item.variation_name,
    item.sku,
    item.lot_number,
    item.serial_number,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(keyword))
}

const filteredItems = computed(() =>
  form.items.filter((item) => matchesItemSearch(item, form.item_search))
)

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

const goBack = () => {
  if (isEditMode.value && transfer.value?.id) {
    router.push({ name: 'inventory-transfer-detail', params: { id: transfer.value.id } })
    return
  }

  router.push({ name: 'inventory-transfers' })
}

const statusLabel = getStockTransferStatusLabel
const statusClasses = getStockTransferStatusClasses

const submitForm = async (send = false) => {
  submitModeSend.value = send

  if (!form.from_warehouse_id || !form.to_warehouse_id) {
    showToast('danger', 'Both source and destination warehouses are required.')
    submitModeSend.value = false
    return
  }

  if (form.from_warehouse_id === form.to_warehouse_id) {
    showToast('danger', 'Source and destination warehouses must be different.')
    submitModeSend.value = false
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
    submitModeSend.value = false
    return
  }

  try {
    if (isEditMode.value && transfer.value?.id) {
      await store.updateItem(transfer.value.id, {
        from_warehouse_id: form.from_warehouse_id,
        to_warehouse_id: form.to_warehouse_id,
        date: form.date,
        notes: form.notes || null,
        send,
        items,
      })

      router.push({ name: 'inventory-transfer-detail', params: { id: transfer.value.id } })
      return
    }

    const response = await store.createItem({
      from_warehouse_id: form.from_warehouse_id,
      to_warehouse_id: form.to_warehouse_id,
      date: form.date,
      notes: form.notes || null,
      send,
      items,
    })

    router.push({ name: 'inventory-transfer-detail', params: { id: response.data.id } })
  } catch (error) {
    showToast('danger', error.response?.data?.message || `Unable to ${isEditMode.value ? 'update' : 'create'} this stock transfer.`)
  } finally {
    submitModeSend.value = false
  }
}

const loadTransfer = async () => {
  if (!isEditMode.value) {
    resetForm()
    return
  }

  transfer.value = await store.fetchItem(route.params.id)
  populateForm()
}

onMounted(async () => {
  const startedAt = Date.now()
  loading.value = true
  loadError.value = ''

  try {
    await Promise.all([
      optionsStore.fetchOptions(),
      loadTransfer(),
    ])
  } catch (error) {
    loadError.value = error.response?.data?.message || 'Unable to prepare the transfer form.'
  } finally {
    await waitForMinimumLoading(startedAt)
    loading.value = false
  }
})
</script>
