<template>
  <AppLayout
    title="Units"
    subtitle="Manage business-wide base units and generic sub-unit conversions for catalog setup."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Catalog' },
      { label: 'Units' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Units"
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
          <button v-if="canCreateUnit" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New unit
          </button>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.short_name }}
            </div>
          </div>
        </template>

        <template #allow_decimal="{ row }">
          <span
            class="erp-badge"
            :class="row.allow_decimal ? 'erp-badge-success' : 'erp-badge-neutral'"
          >
            {{ row.allow_decimal ? 'Decimal allowed' : 'Whole numbers only' }}
          </span>
        </template>

        <template #sub_units="{ row }">
          <div class="space-y-1">
            <div v-if="row.sub_units?.length" class="flex flex-wrap gap-2">
              <span
                v-for="subUnit in row.sub_units"
                :key="subUnit.id"
                class="erp-badge erp-badge-neutral px-2 font-medium"
              >
                {{ subUnit.name }} ({{ subUnit.short_name }}) × {{ subUnit.conversion_factor }}
              </span>
            </div>
            <span v-else class="text-sm text-slate-500 dark:text-slate-400">No sub units</span>
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditUnit" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteUnit" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create unit' : 'Edit unit'"
        icon="measurement"
        size="xl"
        @close="closeModal"
      >
        <Form
          v-slot="{ values, setFieldValue }"
          :key="formKey"
          :validation-schema="schema"
          :initial-values="formValues"
          @submit="submitForm"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="name">Unit name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="short_name">Short name</label>
              <Field id="short_name" name="short_name" class="erp-input" />
              <ErrorMessage name="short_name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <label
            class="mt-5 flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              :checked="Boolean(values.allow_decimal)"
              @change="setFieldValue('allow_decimal', $event.target.checked)"
            />
            <span>Allow decimal quantities for this base unit</span>
          </label>

          <div class="mt-6 rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-slate-900 dark:text-white">Sub units</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add generic conversion units like carton, tray, or dozen. Product-specific pack sizes such as 24 cans per case vs 48 cans per case will be handled later in the Product phase.
                </div>
              </div>
              <button type="button" class="erp-button-secondary" @click="addSubUnit(values, setFieldValue)">
                <i class="fa-solid fa-plus"></i>
                Add sub unit
              </button>
            </div>

            <div v-if="values.sub_units.length" class="mt-4 space-y-4">
              <div
                v-for="(subUnit, index) in values.sub_units"
                :key="subUnit.id || index"
                class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
              >
                <div class="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-start">
                  <div>
                    <label class="erp-label" :for="`sub_units.${index}.name`">Sub unit name</label>
                    <Field :id="`sub_units.${index}.name`" :name="`sub_units[${index}].name`" class="erp-input" />
                    <ErrorMessage :name="`sub_units[${index}].name`" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div>
                    <label class="erp-label" :for="`sub_units.${index}.short_name`">Short name</label>
                    <Field :id="`sub_units.${index}.short_name`" :name="`sub_units[${index}].short_name`" class="erp-input" />
                    <ErrorMessage :name="`sub_units[${index}].short_name`" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div>
                    <label class="erp-label" :for="`sub_units.${index}.conversion_factor`">Conversion factor</label>
                    <Field
                      :id="`sub_units.${index}.conversion_factor`"
                      :name="`sub_units[${index}].conversion_factor`"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      class="erp-input"
                    />
                    <ErrorMessage :name="`sub_units[${index}].conversion_factor`" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div class="md:pt-7">
                    <button type="button" class="erp-button-icon" @click="removeSubUnit(values, setFieldValue, index)">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create unit' : 'Save unit' }}
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
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useUnitsStore } from '@stores/units'

const auth = useAuthStore()
const store = useUnitsStore()

const canCreateUnit = computed(() => auth.can('units.create'))
const canEditUnit = computed(() => auth.can('units.edit'))
const canDeleteUnit = computed(() => auth.can('units.delete'))
const showActionsColumn = computed(() => canEditUnit.value || canDeleteUnit.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Unit' },
    { key: 'allow_decimal', label: 'Quantity rule' },
    { key: 'sub_units', label: 'Sub units' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', unit: null })
const deleteDialog = reactive({ show: false, unit: null, itemName: '' })
const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.unit?.name ?? '',
  short_name: modal.unit?.short_name ?? '',
  allow_decimal: modal.unit?.allow_decimal ?? false,
  sub_units: (modal.unit?.sub_units ?? []).map((subUnit) => ({
    id: subUnit.id,
    name: subUnit.name,
    short_name: subUnit.short_name,
    conversion_factor: Number(subUnit.conversion_factor),
  })),
}))

const schema = yup.object({
  name: yup.string().required().max(150),
  short_name: yup.string().required().max(50),
  allow_decimal: yup.boolean().required(),
  sub_units: yup.array().of(
    yup.object({
      id: yup.string().nullable(),
      name: yup.string().required().max(150),
      short_name: yup.string().required().max(50),
      conversion_factor: yup.number().typeError('Conversion factor is required.').required().moreThan(0),
    })
  ).default([]),
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

const addSubUnit = (values, setFieldValue) => {
  setFieldValue('sub_units', [
    ...(values.sub_units || []),
    { id: null, name: '', short_name: '', conversion_factor: 1 },
  ])
}

const removeSubUnit = (values, setFieldValue, index) => {
  setFieldValue(
    'sub_units',
    (values.sub_units || []).filter((_, itemIndex) => itemIndex !== index)
  )
}

const openCreateModal = () => {
  if (!canCreateUnit.value) return
  modal.mode = 'create'
  modal.unit = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (unit) => {
  if (!canEditUnit.value) return
  modal.mode = 'edit'
  modal.unit = unit
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.unit = null
}

const openDeleteModal = (unit) => {
  if (!canDeleteUnit.value) return
  deleteDialog.show = true
  deleteDialog.unit = unit
  deleteDialog.itemName = unit.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.unit = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchUnits({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchUnits({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchUnits({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      short_name: values.short_name,
      allow_decimal: Boolean(values.allow_decimal),
      sub_units: (values.sub_units || []).map((subUnit) => ({
        id: subUnit.id || null,
        name: subUnit.name,
        short_name: subUnit.short_name,
        conversion_factor: Number(subUnit.conversion_factor),
      })),
    }

    if (modal.mode === 'create') {
      await store.createUnit(payload)
      showToast('success', 'Unit created successfully.')
    } else {
      await store.updateUnit(modal.unit.id, payload)
      showToast('success', 'Unit updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the unit.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.unit) return

  try {
    await store.deleteUnit(deleteDialog.unit.id)
    showToast('success', 'Unit deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the unit.')
  }
}

onMounted(async () => {
  await Promise.all([store.fetchUnits(), store.fetchOptions()])
})
</script>
