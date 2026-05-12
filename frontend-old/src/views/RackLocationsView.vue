<template>
  <AppLayout
    title="Rack Locations"
    subtitle="Manage optional shelf and bin positions inside warehouses."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Catalog' },
      { label: 'Rack Locations' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <article
        v-if="rackLocationFeatureKnown && !rackLocationFeatureEnabled"
        class="erp-card border-amber-200/80 bg-amber-50/80 p-5 dark:border-amber-900/70 dark:bg-amber-950/20"
      >
        <div class="flex items-start gap-3">
          <div class="mt-1 text-amber-600 dark:text-amber-300">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h2 class="text-base font-semibold text-amber-900 dark:text-amber-100">Rack locations are disabled</h2>
            <p class="mt-2 text-sm text-amber-800 dark:text-amber-200">
              Enable <code>stock.enable_rack_location</code> in Settings before creating or updating rack locations.
            </p>
          </div>
        </div>
      </article>

      <DataTable
        title="Rack Locations"
        :columns="columns"
        :rows="store.items"
        :loading="currentLoading"
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
          <div class="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="w-full max-w-sm">
              <AppSelect
                :model-value="store.filters.warehouse_id || null"
                :options="warehouseSelectOptions"
                clearable
                searchable
                placeholder="All warehouses"
                search-placeholder="Search warehouses"
                empty-text="No warehouses found."
                @update:model-value="handleWarehouseFilterChange"
              />
            </div>

            <button
              v-if="canCreateRackLocation"
              type="button"
              class="erp-button-primary"
              :disabled="!rackLocationFeatureEnabled"
              @click="openCreateModal"
            >
              <i class="fa-solid fa-plus"></i>
              New
            </button>
          </div>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.code }}</div>
          </div>
        </template>

        <template #warehouse="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.warehouse?.name || 'Unknown warehouse' }}
          </div>
        </template>

        <template #branch="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.warehouse?.branch?.name || 'No branch' }}
          </div>
        </template>

        <template #description="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.description || 'No description' }}
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button
              v-if="canEditRackLocation"
              type="button"
              class="erp-button-icon"
              :disabled="!rackLocationFeatureEnabled"
              @click="openEditModal(row)"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteRackLocation" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create rack location' : 'Edit rack location'"
        icon="rack position"
        size="lg"
        @close="closeModal"
      >
        <Form
          :key="formKey"
          :validation-schema="schema"
          :initial-values="formValues"
          @submit="submitForm"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="warehouse_id">Warehouse</label>
              <AppSelect
                :model-value="formWarehouseValue"
                :options="warehouseSelectOptions"
                searchable
                placeholder="Select warehouse"
                search-placeholder="Search warehouses"
                empty-text="No warehouses found."
                @update:model-value="formWarehouseValue = $event"
              />
            </div>

            <div>
              <label class="erp-label" for="code">Code</label>
              <Field id="code" name="code" class="erp-input" />
              <ErrorMessage name="code" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="name">Rack location name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="description">Description</label>
              <Field id="description" name="description" class="erp-input" />
              <ErrorMessage name="description" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving || !rackLocationFeatureEnabled">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create rack location' : 'Save rack location' }}
            </button>
          </div>
        </Form>
      </AppModal>

      <ConfirmDelete
        :show="deleteDialog.show"
        :item-name="deleteDialog.itemName"
        :loading="store.deleting"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { getWarehouses } from '@api/warehouses'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useRackLocationsStore } from '@stores/rackLocations'
import { useSettingsStore } from '@stores/settings'

const auth = useAuthStore()
const store = useRackLocationsStore()
const settingsStore = useSettingsStore()

const canCreateRackLocation = computed(() => auth.can('rack_locations.create'))
const canEditRackLocation = computed(() => auth.can('rack_locations.edit'))
const canDeleteRackLocation = computed(() => auth.can('rack_locations.delete'))
const canViewSettings = computed(() => auth.can('settings.index'))
const showActionsColumn = computed(() => canEditRackLocation.value || canDeleteRackLocation.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Rack location' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'branch', label: 'Branch' },
    { key: 'description', label: 'Description' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', rackLocation: null })
const deleteDialog = reactive({ show: false, rackLocation: null, itemName: '' })
const formKey = ref(0)
const formWarehouseValue = ref(null)
const warehouses = ref([])

const warehouseSelectOptions = computed(() =>
  warehouses.value.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.branch?.name || warehouse.code || 'Warehouse',
    keywords: [warehouse.name, warehouse.code, warehouse.branch?.name].filter(Boolean).join(' '),
  }))
)

const rackLocationFeatureKnown = computed(() => Object.prototype.hasOwnProperty.call(settingsStore.groups, 'stock'))
const rackLocationFeatureEnabled = computed(() =>
  canViewSettings.value
    ? Boolean(settingsStore.groups.stock?.enable_rack_location)
    : true
)

const currentLoading = computed(() => store.loading || (canViewSettings.value && settingsStore.loading))

const formValues = computed(() => ({
  name: modal.rackLocation?.name ?? '',
  code: modal.rackLocation?.code ?? '',
  description: modal.rackLocation?.description ?? '',
}))

const schema = yup.object({
  name: yup.string().required().max(100),
  code: yup.string().required().max(50),
  description: yup.string().nullable(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => {
    alert.show = true
  })
}

const loadWarehouses = async () => {
  try {
    const response = await getWarehouses({ per_page: 100 })
    warehouses.value = response.data.data
  } catch {
    warehouses.value = []
  }
}

const openCreateModal = () => {
  if (!canCreateRackLocation.value || !rackLocationFeatureEnabled.value) return
  modal.mode = 'create'
  modal.rackLocation = null
  formWarehouseValue.value = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (rackLocation) => {
  if (!canEditRackLocation.value || !rackLocationFeatureEnabled.value) return
  modal.mode = 'edit'
  modal.rackLocation = rackLocation
  formWarehouseValue.value = rackLocation.warehouse_id ?? rackLocation.warehouse?.id ?? null
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.rackLocation = null
  formWarehouseValue.value = null
}

const openDeleteModal = (rackLocation) => {
  if (!canDeleteRackLocation.value) return
  deleteDialog.show = true
  deleteDialog.rackLocation = rackLocation
  deleteDialog.itemName = rackLocation.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.rackLocation = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchRackLocations({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchRackLocations({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchRackLocations({ per_page: perPage, page: 1 })
}

const handleWarehouseFilterChange = async (value) => {
  await store.fetchRackLocations({ warehouse_id: value || '', page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      warehouse_id: formWarehouseValue.value,
      name: values.name,
      code: values.code,
      description: values.description || null,
    }

    if (modal.mode === 'create') {
      await store.createRackLocation(payload)
      showToast('success', 'Rack location created successfully.')
    } else {
      await store.updateRackLocation(modal.rackLocation.id, payload)
      showToast('success', 'Rack location updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the rack location.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.rackLocation) return

  try {
    await store.deleteRackLocation(deleteDialog.rackLocation.id)
    showToast('success', 'Rack location deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the rack location.')
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchRackLocations(),
    store.fetchOptions(),
    loadWarehouses(),
    canViewSettings.value ? settingsStore.fetchGroup('stock') : Promise.resolve(),
  ])
})
</script>
