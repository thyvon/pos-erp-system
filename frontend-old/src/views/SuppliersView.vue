<template>
  <AppLayout
    title="Suppliers"
    subtitle="Manage supplier records, pay terms, balances, and reusable contact details."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Suppliers' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Suppliers"
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
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="w-full sm:w-44">
              <AppSelect
                :model-value="store.filters.status || null"
                :options="statusOptions"
                clearable
                placeholder="Any status"
                @update:model-value="handleStatusFilter($event)"
              />
            </div>
            <button v-if="canCreateSupplier" type="button" class="erp-button-primary" @click="openCreateModal">
              <i class="fa-solid fa-plus"></i>
              New supplier
            </button>
          </div>
        </template>

        <template #supplier="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.code }} · {{ row.company || 'No company' }}
            </div>
          </div>
        </template>

        <template #contact="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            <div>{{ row.email || 'No email' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.phone || row.mobile || 'No phone' }}</div>
          </div>
        </template>

        <template #balance="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ formatMoney(row.balance) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Opening: {{ formatMoney(row.opening_balance) }}
            </div>
          </div>
        </template>

        <template #status="{ row }">
          <StatusBadge :status="row.status" />
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditSupplier" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteSupplier" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create supplier' : 'Edit supplier'"
        icon="supplier profile"
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
              <label class="erp-label" for="name">Supplier name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="company">Company</label>
              <Field id="company" name="company" class="erp-input" />
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label class="erp-label" for="email">Email</label>
              <Field id="email" name="email" class="erp-input" />
              <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="phone">Phone</label>
              <Field id="phone" name="phone" class="erp-input" />
            </div>
            <div>
              <label class="erp-label" for="mobile">Mobile</label>
              <Field id="mobile" name="mobile" class="erp-input" />
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <label class="erp-label" for="tax_id">Tax ID</label>
              <Field id="tax_id" name="tax_id" class="erp-input" />
            </div>
            <div>
              <label class="erp-label" for="pay_term">Pay term (days)</label>
              <Field id="pay_term" name="pay_term" type="number" min="0" class="erp-input" />
            </div>
            <div>
              <label class="erp-label" for="opening_balance">Opening balance</label>
              <Field id="opening_balance" name="opening_balance" type="number" min="0" step="0.01" class="erp-input" />
            </div>
            <div>
              <label class="erp-label" for="status">Status</label>
              <AppSelect
                :model-value="values.status || null"
                :options="statusOptions"
                placeholder="Select status"
                @update:model-value="setFieldValue('status', $event || '')"
              />
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="address_line1">Address line 1</label>
              <Field id="address_line1" name="address_line1" class="erp-input" />
            </div>
            <div>
              <label class="erp-label" for="address_city">City</label>
              <Field id="address_city" name="address_city" class="erp-input" />
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="address_state">State / Province</label>
              <Field id="address_state" name="address_state" class="erp-input" />
            </div>
            <div>
              <label class="erp-label" for="address_country">Country</label>
              <Field id="address_country" name="address_country" class="erp-input" />
            </div>
          </div>

          <div class="mt-4">
            <label class="erp-label" for="notes">Notes</label>
            <Field id="notes" name="notes" as="textarea" rows="3" class="erp-input min-h-[6rem]" />
          </div>

          <div v-if="customFieldDefinitions.length" class="mt-6 space-y-4">
            <div class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Custom fields
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div v-for="definition in customFieldDefinitions" :key="definition.id">
                <label class="erp-label" :for="`custom-${definition.field_name}`">{{ definition.field_label }}</label>
                <Field
                  v-if="definition.field_type === 'text' || definition.field_type === 'number' || definition.field_type === 'date'"
                  :id="`custom-${definition.field_name}`"
                  :name="`custom_field_${definition.field_name}`"
                  :type="definition.field_type === 'date' ? 'date' : definition.field_type === 'number' ? 'number' : 'text'"
                  class="erp-input"
                />
                <AppSelect
                  v-else-if="definition.field_type === 'select'"
                  :model-value="values[`custom_field_${definition.field_name}`] ?? null"
                  :options="(definition.options || []).map((option) => ({ value: option, label: option }))"
                  clearable
                  placeholder="Select option"
                  @update:model-value="setFieldValue(`custom_field_${definition.field_name}`, $event || '')"
                />
                <label
                  v-else-if="definition.field_type === 'checkbox'"
                  class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    :checked="Boolean(values[`custom_field_${definition.field_name}`])"
                    @change="setFieldValue(`custom_field_${definition.field_name}`, $event.target.checked)"
                  />
                  <span>{{ definition.field_label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <label class="erp-label" for="documents_text">Document URLs</label>
            <Field id="documents_text" name="documents_text" as="textarea" rows="4" class="erp-input min-h-[7rem]" />
            <p class="erp-helper text-slate-500 dark:text-slate-400">
              One document URL per line. Real file-upload storage can be added later without changing the supplier record shape.
            </p>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create supplier' : 'Save supplier' }}
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
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import StatusBadge from '@components/ui/StatusBadge.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { getCustomFields } from '@api/customFields'
import { useAuthStore } from '@stores/auth'
import { useSuppliersStore } from '@stores/suppliers'

const auth = useAuthStore()
const store = useSuppliersStore()

const canCreateSupplier = computed(() => auth.can('suppliers.create'))
const canEditSupplier = computed(() => auth.can('suppliers.edit'))
const canDeleteSupplier = computed(() => auth.can('suppliers.delete'))
const showActionsColumn = computed(() => canEditSupplier.value || canDeleteSupplier.value)

const columns = computed(() => {
  const base = [
    { key: 'supplier', label: 'Supplier' },
    { key: 'contact', label: 'Contact' },
    { key: 'balance', label: 'Balance' },
    { key: 'status', label: 'Status' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', supplier: null })
const deleteDialog = reactive({ show: false, supplier: null, itemName: '' })
const formKey = ref(0)
const customFieldDefinitions = ref([])

const formValues = computed(() => {
  const values = {
    name: modal.supplier?.name ?? '',
    company: modal.supplier?.company ?? '',
    email: modal.supplier?.email ?? '',
    phone: modal.supplier?.phone ?? '',
    mobile: modal.supplier?.mobile ?? '',
    tax_id: modal.supplier?.tax_id ?? '',
    pay_term: modal.supplier?.pay_term ?? 0,
    opening_balance: modal.supplier?.opening_balance ?? 0,
    status: modal.supplier?.status ?? 'active',
    notes: modal.supplier?.notes ?? '',
    address_line1: modal.supplier?.address?.line1 ?? '',
    address_city: modal.supplier?.address?.city ?? '',
    address_state: modal.supplier?.address?.state ?? '',
    address_country: modal.supplier?.address?.country ?? '',
    documents_text: Array.isArray(modal.supplier?.documents) ? modal.supplier.documents.join('\n') : '',
  }

  customFieldDefinitions.value.forEach((definition) => {
    values[`custom_field_${definition.field_name}`] = modal.supplier?.custom_fields?.[definition.field_name]
      ?? (definition.field_type === 'checkbox' ? false : '')
  })

  return values
})

const schema = yup.object({
  name: yup.string().required().max(191),
  company: yup.string().nullable().max(191),
  email: yup.string().nullable().email(),
  phone: yup.string().nullable(),
  mobile: yup.string().nullable(),
  tax_id: yup.string().nullable(),
  pay_term: yup.number().typeError('Pay term is required.').min(0).required(),
  opening_balance: yup.number().typeError('Opening balance is required.').min(0).required(),
  status: yup.string().required(),
  notes: yup.string().nullable(),
  address_line1: yup.string().nullable(),
  address_city: yup.string().nullable(),
  address_state: yup.string().nullable(),
  address_country: yup.string().nullable(),
  documents_text: yup.string().nullable(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const formatMoney = (value) => Number(value || 0).toFixed(2)

const loadCustomFieldDefinitions = async () => {
  try {
    const response = await getCustomFields({ module: 'supplier', per_page: 100 })
    customFieldDefinitions.value = response.data.data
  } catch {
    customFieldDefinitions.value = []
  }
}

const openCreateModal = () => {
  if (!canCreateSupplier.value) return
  modal.mode = 'create'
  modal.supplier = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (supplier) => {
  if (!canEditSupplier.value) return
  modal.mode = 'edit'
  modal.supplier = supplier
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.supplier = null
}

const openDeleteModal = (supplier) => {
  if (!canDeleteSupplier.value) return
  deleteDialog.show = true
  deleteDialog.supplier = supplier
  deleteDialog.itemName = supplier.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.supplier = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchSuppliers({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchSuppliers({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchSuppliers({ per_page: perPage, page: 1 })
}

const handleStatusFilter = async (value) => {
  await store.fetchSuppliers({ status: value || '', page: 1 })
}

const submitForm = async (values) => {
  try {
    const customFields = {}

    customFieldDefinitions.value.forEach((definition) => {
      const value = values[`custom_field_${definition.field_name}`]

      if (definition.field_type === 'checkbox') {
        customFields[definition.field_name] = Boolean(value)
        return
      }

      if (value !== '' && value !== null && value !== undefined) {
        customFields[definition.field_name] = value
      }
    })

    const payload = {
      name: values.name,
      company: values.company || null,
      email: values.email || null,
      phone: values.phone || null,
      mobile: values.mobile || null,
      tax_id: values.tax_id || null,
      address: {
        line1: values.address_line1 || null,
        city: values.address_city || null,
        state: values.address_state || null,
        country: values.address_country || null,
      },
      pay_term: Number(values.pay_term || 0),
      opening_balance: Number(values.opening_balance || 0),
      status: values.status,
      notes: values.notes || null,
      custom_fields: customFields,
      documents: (values.documents_text || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    if (modal.mode === 'create') {
      await store.createSupplier(payload)
      showToast('success', 'Supplier created successfully.')
    } else {
      await store.updateSupplier(modal.supplier.id, payload)
      showToast('success', 'Supplier updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the supplier.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.supplier) return

  try {
    await store.deleteSupplier(deleteDialog.supplier.id)
    showToast('success', 'Supplier deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the supplier.')
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchSuppliers(),
    loadCustomFieldDefinitions(),
  ])
})
</script>
