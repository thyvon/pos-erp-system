<template>
  <AppLayout
    title="Customers"
    subtitle="Manage customers, contact details, limits, and reusable customer-group assignments."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Customers' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Customers"
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
                :options="statusFilterOptions"
                clearable
                placeholder="Any status"
                @update:model-value="handleStatusFilter($event)"
              />
            </div>
            <div class="w-full sm:w-56">
              <AppSelect
                :model-value="store.filters.customer_group_id || null"
                :options="customerGroupOptions"
                clearable
                searchable
                placeholder="All groups"
                search-placeholder="Search groups"
                @update:model-value="handleGroupFilter($event)"
              />
            </div>
            <button v-if="canCreateCustomer" type="button" class="erp-button-primary" @click="openCreateModal">
              <i class="fa-solid fa-plus"></i>
              New customer
            </button>
          </div>
        </template>

        <template #customer="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.code }} · {{ row.type === 'company' ? 'Company' : 'Individual' }}
            </div>
          </div>
        </template>

        <template #contact="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            <div>{{ row.email || 'No email' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.phone || row.mobile || 'No phone' }}</div>
          </div>
        </template>

        <template #group="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.customer_group?.name || 'No group' }}
          </div>
        </template>

        <template #balance="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ formatMoney(row.balance) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Limit: {{ formatMoney(row.credit_limit) }}
            </div>
          </div>
        </template>

        <template #status="{ row }">
          <StatusBadge :status="row.status" />
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditCustomer" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteCustomer" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create customer' : 'Edit customer'"
        icon="customer profile"
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
              <label class="erp-label" for="name">Customer name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="type">Type</label>
              <AppSelect
                :model-value="values.type || null"
                :options="typeOptions"
                placeholder="Select type"
                @update:model-value="setFieldValue('type', $event || '')"
              />
              <ErrorMessage name="type" class="erp-helper text-rose-500 dark:text-rose-400" />
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
              <ErrorMessage name="phone" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="mobile">Mobile</label>
              <Field id="mobile" name="mobile" class="erp-input" />
              <ErrorMessage name="mobile" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label class="erp-label" for="customer_group_id">Customer group</label>
              <AppSelect
                :model-value="values.customer_group_id || null"
                :options="customerGroupOptions"
                clearable
                searchable
                placeholder="No group"
                search-placeholder="Search groups"
                @update:model-value="setFieldValue('customer_group_id', $event || '')"
              />
              <ErrorMessage name="customer_group_id" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="status">Status</label>
              <AppSelect
                :model-value="values.status || null"
                :options="statusFormOptions"
                placeholder="Select status"
                @update:model-value="setFieldValue('status', $event || '')"
              />
              <ErrorMessage name="status" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="date_of_birth">Date of birth</label>
              <AppDatePicker
                id="date_of_birth"
                :model-value="values.date_of_birth || ''"
                @update:model-value="setFieldValue('date_of_birth', $event || '')"
              />
              <ErrorMessage name="date_of_birth" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <label class="erp-label" for="tax_id">Tax ID</label>
              <Field id="tax_id" name="tax_id" class="erp-input" />
            </div>
            <div>
              <label class="erp-label" for="credit_limit">Credit limit</label>
              <Field id="credit_limit" name="credit_limit" type="number" min="0" step="0.01" class="erp-input" />
              <ErrorMessage name="credit_limit" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="pay_term">Pay term (days)</label>
              <Field id="pay_term" name="pay_term" type="number" min="0" class="erp-input" />
              <ErrorMessage name="pay_term" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="opening_balance">Opening balance</label>
              <Field id="opening_balance" name="opening_balance" type="number" min="0" step="0.01" class="erp-input" />
              <ErrorMessage name="opening_balance" class="erp-helper text-rose-500 dark:text-rose-400" />
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
              One document URL per line. File upload storage can be added later without changing the customer record shape.
            </p>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create customer' : 'Save customer' }}
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
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import StatusBadge from '@components/ui/StatusBadge.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { getCustomerGroups } from '@api/customerGroups'
import { getCustomFields } from '@api/customFields'
import { useAuthStore } from '@stores/auth'
import { useCustomersStore } from '@stores/customers'

const auth = useAuthStore()
const store = useCustomersStore()

const canCreateCustomer = computed(() => auth.can('customers.create'))
const canEditCustomer = computed(() => auth.can('customers.edit'))
const canDeleteCustomer = computed(() => auth.can('customers.delete'))
const showActionsColumn = computed(() => canEditCustomer.value || canDeleteCustomer.value)

const columns = computed(() => {
  const base = [
    { key: 'customer', label: 'Customer' },
    { key: 'contact', label: 'Contact' },
    { key: 'group', label: 'Group' },
    { key: 'balance', label: 'Balance' },
    { key: 'status', label: 'Status' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const typeOptions = [
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company' },
]

const statusFilterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const statusFormOptions = statusFilterOptions

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', customer: null })
const deleteDialog = reactive({ show: false, customer: null, itemName: '' })
const formKey = ref(0)
const customerGroups = ref([])
const customFieldDefinitions = ref([])

const customerGroupOptions = computed(() =>
  customerGroups.value.map((group) => ({
    value: group.id,
    label: group.name,
  }))
)

const formValues = computed(() => {
  const values = {
    customer_group_id: modal.customer?.customer_group_id ?? '',
    name: modal.customer?.name ?? '',
    type: modal.customer?.type ?? 'individual',
    email: modal.customer?.email ?? '',
    phone: modal.customer?.phone ?? '',
    mobile: modal.customer?.mobile ?? '',
    tax_id: modal.customer?.tax_id ?? '',
    date_of_birth: modal.customer?.date_of_birth ?? '',
    credit_limit: modal.customer?.credit_limit ?? 0,
    pay_term: modal.customer?.pay_term ?? 0,
    opening_balance: modal.customer?.opening_balance ?? 0,
    status: modal.customer?.status ?? 'active',
    notes: modal.customer?.notes ?? '',
    address_line1: modal.customer?.address?.line1 ?? '',
    address_city: modal.customer?.address?.city ?? '',
    address_state: modal.customer?.address?.state ?? '',
    address_country: modal.customer?.address?.country ?? '',
    documents_text: Array.isArray(modal.customer?.documents) ? modal.customer.documents.join('\n') : '',
  }

  customFieldDefinitions.value.forEach((definition) => {
    values[`custom_field_${definition.field_name}`] = modal.customer?.custom_fields?.[definition.field_name]
      ?? (definition.field_type === 'checkbox' ? false : '')
  })

  return values
})

const schema = yup.object({
  customer_group_id: yup.string().nullable(),
  name: yup.string().required().max(191),
  type: yup.string().required(),
  email: yup.string().nullable().email(),
  phone: yup.string().nullable(),
  mobile: yup.string().nullable(),
  tax_id: yup.string().nullable(),
  date_of_birth: yup.string().nullable(),
  credit_limit: yup.number().typeError('Credit limit is required.').min(0).required(),
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

const loadCustomerGroups = async () => {
  try {
    const response = await getCustomerGroups({ per_page: 100 })
    customerGroups.value = response.data.data
  } catch {
    customerGroups.value = []
  }
}

const loadCustomFieldDefinitions = async () => {
  try {
    const response = await getCustomFields({ module: 'customer', per_page: 100 })
    customFieldDefinitions.value = response.data.data
  } catch {
    customFieldDefinitions.value = []
  }
}

const openCreateModal = () => {
  if (!canCreateCustomer.value) return
  modal.mode = 'create'
  modal.customer = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (customer) => {
  if (!canEditCustomer.value) return
  modal.mode = 'edit'
  modal.customer = customer
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.customer = null
}

const openDeleteModal = (customer) => {
  if (!canDeleteCustomer.value) return
  deleteDialog.show = true
  deleteDialog.customer = customer
  deleteDialog.itemName = customer.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.customer = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchCustomers({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchCustomers({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchCustomers({ per_page: perPage, page: 1 })
}

const handleStatusFilter = async (value) => {
  await store.fetchCustomers({ status: value || '', page: 1 })
}

const handleGroupFilter = async (value) => {
  await store.fetchCustomers({ customer_group_id: value || '', page: 1 })
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
      customer_group_id: values.customer_group_id || null,
      name: values.name,
      type: values.type,
      email: values.email || null,
      phone: values.phone || null,
      mobile: values.mobile || null,
      tax_id: values.tax_id || null,
      date_of_birth: values.date_of_birth || null,
      address: {
        line1: values.address_line1 || null,
        city: values.address_city || null,
        state: values.address_state || null,
        country: values.address_country || null,
      },
      credit_limit: Number(values.credit_limit || 0),
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
      await store.createCustomer(payload)
      showToast('success', 'Customer created successfully.')
    } else {
      await store.updateCustomer(modal.customer.id, payload)
      showToast('success', 'Customer updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the customer.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.customer) return

  try {
    await store.deleteCustomer(deleteDialog.customer.id)
    showToast('success', 'Customer deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the customer.')
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchCustomers(),
    loadCustomerGroups(),
    loadCustomFieldDefinitions(),
  ])
})
</script>
