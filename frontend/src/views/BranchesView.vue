<template>
  <AppLayout
    title="Branches"
    subtitle="Manage selling locations, branch defaults, and manager assignments."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Branches' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Branches"
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
          <button v-if="canCreateBranch" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New branch
          </button>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.code || 'Auto code' }}</div>
          </div>
        </template>

        <template #manager="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.manager ? `${row.manager.first_name} ${row.manager.last_name || ''}`.trim() : 'Unassigned' }}
          </div>
        </template>

        <template #status="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :status="row.is_active ? 'active' : 'inactive'" />
            <span
              v-if="row.is_default"
              class="inline-flex rounded-[5px] bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300"
            >
              Default
            </span>
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditBranch" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteBranch" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create branch' : 'Edit branch'"
        icon="location setup"
        size="lg"
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
              <label class="erp-label" for="name">Branch name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="code">Code</label>
              <Field id="code" name="code" class="erp-input" />
              <ErrorMessage name="code" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="type">Type</label>
              <Field id="type" as="select" name="type" class="erp-select">
                <option value="">Select type</option>
                <option value="retail">Retail</option>
                <option value="warehouse">Warehouse</option>
                <option value="office">Office</option>
                <option value="online">Online</option>
              </Field>
              <ErrorMessage name="type" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="manager_id">Manager</label>
              <Field id="manager_id" as="select" name="manager_id" class="erp-select">
                <option value="">No manager</option>
                <option v-for="user in managerOptions" :key="user.id" :value="user.id">{{ user.full_name }}</option>
              </Field>
              <ErrorMessage name="manager_id" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="email">Email</label>
              <Field id="email" name="email" type="email" class="erp-input" />
              <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="phone">Phone</label>
              <Field id="phone" name="phone" class="erp-input" />
              <ErrorMessage name="phone" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="address_line1">Address line 1</label>
              <Field id="address_line1" name="address.line1" class="erp-input" />
              <ErrorMessage name="address.line1" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="address_city">City</label>
              <Field id="address_city" name="address.city" class="erp-input" />
              <ErrorMessage name="address.city" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.is_default)"
                @change="setFieldValue('is_default', $event.target.checked)"
              />
              <span>Set as default branch</span>
            </label>
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.is_active)"
                @change="setFieldValue('is_active', $event.target.checked)"
              />
              <span>Branch is active</span>
            </label>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create branch' : 'Save branch' }}
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
import { getUsers } from '@api/users'
import { useAuthStore } from '@stores/auth'
import { useBranchesStore } from '@stores/branches'

const auth = useAuthStore()
const store = useBranchesStore()

const canCreateBranch = computed(() => auth.can('branches.create'))
const canEditBranch = computed(() => auth.can('branches.edit'))
const canDeleteBranch = computed(() => auth.can('branches.delete'))
const showActionsColumn = computed(() => canEditBranch.value || canDeleteBranch.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Branch' },
    { key: 'type', label: 'Type' },
    { key: 'manager', label: 'Manager' },
    { key: 'status', label: 'Status' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', branch: null })
const deleteDialog = reactive({ show: false, branch: null, itemName: '' })
const managerOptions = ref([])
const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.branch?.name ?? '',
  code: modal.branch?.code ?? '',
  type: modal.branch?.type ?? '',
  email: modal.branch?.email ?? '',
  phone: modal.branch?.phone ?? '',
  manager_id: modal.branch?.manager?.id ?? '',
  address: {
    line1: modal.branch?.address?.line1 ?? '',
    city: modal.branch?.address?.city ?? '',
  },
  is_default: modal.branch?.is_default ?? false,
  is_active: modal.branch?.is_active ?? true,
}))

const schema = yup.object({
  name: yup.string().required().max(255),
  code: yup.string().nullable().max(50),
  type: yup.string().nullable(),
  email: yup.string().nullable().email().max(100),
  phone: yup.string().nullable().max(20),
  manager_id: yup.string().nullable(),
  address: yup.object({
    line1: yup.string().nullable().max(255),
    city: yup.string().nullable().max(100),
  }),
  is_default: yup.boolean().nullable(),
  is_active: yup.boolean().nullable(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const loadManagerOptions = async () => {
  if (!auth.can('users.index')) {
    managerOptions.value = []
    return
  }

  try {
    const response = await getUsers({ per_page: 100 })
    managerOptions.value = response.data.data.map((user) => ({
      id: user.id,
      full_name: user.full_name,
    }))
  } catch {
    managerOptions.value = []
  }
}

const openCreateModal = () => {
  if (!canCreateBranch.value) return
  modal.mode = 'create'
  modal.branch = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (branch) => {
  if (!canEditBranch.value) return
  modal.mode = 'edit'
  modal.branch = branch
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.branch = null
}

const openDeleteModal = (branch) => {
  if (!canDeleteBranch.value) return
  deleteDialog.show = true
  deleteDialog.branch = branch
  deleteDialog.itemName = branch.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.branch = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchBranches({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchBranches({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchBranches({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      ...values,
      is_default: Boolean(values.is_default),
      is_active: Boolean(values.is_active),
    }

    if (modal.mode === 'create') {
      await store.createBranch(payload)
      showToast('success', 'Branch created successfully.')
    } else {
      await store.updateBranch(modal.branch.id, payload)
      showToast('success', 'Branch updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the branch.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.branch) return

  try {
    await store.deleteBranch(deleteDialog.branch.id)
    showToast('success', 'Branch deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the branch.')
  }
}

onMounted(async () => {
  await Promise.all([store.fetchBranches(), loadManagerOptions()])
})
</script>
