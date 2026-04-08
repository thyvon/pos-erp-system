<template>
  <AppLayout
    title="Start Stock Count"
    subtitle="Create a stock count session, then move straight into the live counting workspace."
    :breadcrumbs="breadcrumbs"
  >
    <div class="mx-auto max-w-4xl space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <div class="erp-form-page relative z-0 overflow-visible focus-within:z-20">
        <div class="mb-5">
          <h2 class="text-lg font-semibold text-slate-950 dark:text-white">Count Setup</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose the warehouse and date, then continue into the live count workspace.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="erp-label">Warehouse</label>
            <AppSelect
              :model-value="form.warehouse_id || null"
              :options="warehouseOptions"
              searchable
              placeholder="Select warehouse"
              @update:model-value="form.warehouse_id = $event || ''"
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
          <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Optional internal note for this count session.
          </p>
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
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useInventoryCountsStore, useInventoryOptionsStore } from '@stores/inventory'

const router = useRouter()
const store = useInventoryCountsStore()
const optionsStore = useInventoryOptionsStore()

const breadcrumbs = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Inventory' },
  { label: 'Counts', to: '/inventory/counts' },
  { label: 'Start Count' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const form = reactive({
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

const goBack = () => {
  router.push({ name: 'inventory-counts' })
}

const submitCreate = async () => {
  if (!form.warehouse_id) {
    showToast('danger', 'Warehouse is required.')
    return
  }

  try {
    const response = await store.createItem({
      warehouse_id: form.warehouse_id,
      date: form.date,
      notes: form.notes || null,
    })

    router.push({ name: 'inventory-counts-workspace', params: { id: response.data.id } })
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to start the stock count.')
  }
}

onMounted(async () => {
  if (optionsStore.warehouses.length === 0) {
    await optionsStore.fetchOptions()
  }
})
</script>
