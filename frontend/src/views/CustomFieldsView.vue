<template>
  <AppLayout
    title="Custom Fields"
    subtitle="Define extra tenant-specific fields for products, customers, and suppliers."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Custom Fields' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Custom Field Definitions"
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
          <button v-if="canCreateCustomField" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New field
          </button>
        </template>

        <template #module="{ row }">
          <span class="inline-flex rounded-[5px] bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
            {{ row.module }}
          </span>
        </template>

        <template #field_label="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.field_label }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.field_name }}</div>
          </div>
        </template>

        <template #field_type="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.field_type }}
            <div v-if="row.options?.length" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.options.join(', ') }}
            </div>
          </div>
        </template>

        <template #required="{ row }">
          <StatusBadge :status="row.is_required ? 'active' : 'inactive'" />
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditCustomField" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteCustomField" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create custom field' : 'Edit custom field'"
        icon="schema extension"
        size="lg"
        @close="closeModal"
      >
        <Form :key="formKey" :validation-schema="schema" :initial-values="formValues" @submit="submitForm">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="module">Module</label>
              <Field id="module" as="select" name="module" class="erp-select">
                <option value="product">Product</option>
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
              </Field>
              <ErrorMessage name="module" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="field_type">Field type</label>
              <Field id="field_type" as="select" name="field_type" class="erp-select">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
              </Field>
              <ErrorMessage name="field_type" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="field_label">Field label</label>
              <Field id="field_label" name="field_label" class="erp-input" />
              <ErrorMessage name="field_label" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="field_name">Field name</label>
              <Field id="field_name" name="field_name" class="erp-input" />
              <ErrorMessage name="field_name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="sort_order">Sort order</label>
              <Field id="sort_order" name="sort_order" type="number" min="0" class="erp-input" />
              <ErrorMessage name="sort_order" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <label class="mt-6 flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <Field name="is_required" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
              <span>Required field</span>
            </label>
          </div>

          <div>
            <label class="erp-label" for="options_text">Options</label>
            <Field id="options_text" name="options_text" as="textarea" rows="4" class="erp-input min-h-[7rem]" />
            <p class="erp-helper text-slate-500 dark:text-slate-400">For select fields, enter one option per line.</p>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create field' : 'Save field' }}
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
import StatusBadge from '@components/ui/StatusBadge.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useCustomFieldsStore } from '@stores/customFields'

const auth = useAuthStore()
const store = useCustomFieldsStore()

const canCreateCustomField = computed(() => auth.can('custom_fields.create'))
const canEditCustomField = computed(() => auth.can('custom_fields.edit'))
const canDeleteCustomField = computed(() => auth.can('custom_fields.delete'))
const showActionsColumn = computed(() => canEditCustomField.value || canDeleteCustomField.value)

const columns = computed(() => {
  const base = [
    { key: 'module', label: 'Module' },
    { key: 'field_label', label: 'Field' },
    { key: 'field_type', label: 'Type' },
    { key: 'required', label: 'Required' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', definition: null })
const deleteDialog = reactive({ show: false, definition: null, itemName: '' })
const formKey = ref(0)

const formValues = computed(() => ({
  module: modal.definition?.module ?? 'product',
  field_label: modal.definition?.field_label ?? '',
  field_name: modal.definition?.field_name ?? '',
  field_type: modal.definition?.field_type ?? 'text',
  options_text: modal.definition?.options?.join('\n') ?? '',
  is_required: modal.definition?.is_required ?? false,
  sort_order: modal.definition?.sort_order ?? 0,
}))

const schema = yup.object({
  module: yup.string().required(),
  field_label: yup.string().required().max(150),
  field_name: yup.string().required().max(100),
  field_type: yup.string().required(),
  options_text: yup.string().nullable(),
  is_required: yup.boolean().nullable(),
  sort_order: yup.number().min(0).max(999).required(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const openCreateModal = () => {
  if (!canCreateCustomField.value) return
  modal.mode = 'create'
  modal.definition = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (definition) => {
  if (!canEditCustomField.value) return
  modal.mode = 'edit'
  modal.definition = definition
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.definition = null
}

const openDeleteModal = (definition) => {
  if (!canDeleteCustomField.value) return
  deleteDialog.show = true
  deleteDialog.definition = definition
  deleteDialog.itemName = definition.field_label
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.definition = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchCustomFields({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchCustomFields({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchCustomFields({ per_page: perPage, page: 1 })
}

const normalizePayload = (values) => ({
  module: values.module,
  field_label: values.field_label,
  field_name: values.field_name,
  field_type: values.field_type,
  options: values.field_type === 'select'
    ? values.options_text.split('\n').map((item) => item.trim()).filter(Boolean)
    : null,
  is_required: values.is_required,
  sort_order: Number(values.sort_order || 0),
})

const submitForm = async (values) => {
  try {
    const payload = normalizePayload(values)

    if (modal.mode === 'create') {
      await store.createCustomField(payload)
      showToast('success', 'Custom field created successfully.')
    } else {
      await store.updateCustomField(modal.definition.id, payload)
      showToast('success', 'Custom field updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the custom field.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.definition) return

  try {
    await store.deleteCustomField(deleteDialog.definition.id)
    showToast('success', 'Custom field deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the custom field.')
  }
}

onMounted(async () => {
  await store.fetchCustomFields()
})
</script>
