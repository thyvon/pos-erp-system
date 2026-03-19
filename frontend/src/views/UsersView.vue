<template>
  <AppLayout
    title="Users"
    subtitle="Manage user access, roles, and account status."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Users' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert
        v-model:show="alert.show"
        :type="alert.type"
        :title="alert.title"
        :message="alert.message"
      />

      <DataTable
        title="Users"
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
          <button type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New user
          </button>
        </template>

        <template #full_name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.full_name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.phone || 'No phone' }}</div>
          </div>
        </template>

        <template #role="{ row }">
          <span class="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
            {{ row.roles?.[0] || 'n/a' }}
          </span>
        </template>

        <template #status="{ row }">
          <StatusBadge :status="row.status" />
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <button type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              type="button"
              class="erp-button-icon"
              :disabled="isCurrentUser(row)"
              @click="openDeleteModal(row)"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create user' : 'Edit user'"
        icon="user account"
        size="lg"
        @close="closeModal"
      >
        <Form :key="formKey" :validation-schema="schema" :initial-values="formValues" @submit="submitForm">
          <div class="erp-form-grid">
            <div>
              <label class="erp-label" for="first_name">First name</label>
              <Field id="first_name" name="first_name" class="erp-input" />
              <ErrorMessage name="first_name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="last_name">Last name</label>
              <Field id="last_name" name="last_name" class="erp-input" />
              <ErrorMessage name="last_name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="erp-form-grid">
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

          <div class="erp-form-grid">
            <div>
              <label class="erp-label" for="role">Role</label>
              <Field id="role" as="select" name="role" class="erp-select">
                <option value="">Select role</option>
                <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
              </Field>
              <ErrorMessage name="role" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="status">Status</label>
              <Field id="status" as="select" name="status" class="erp-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Field>
              <ErrorMessage name="status" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="erp-form-grid">
            <div>
              <label class="erp-label" for="password">
                Password
                <span class="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {{ modal.mode === 'create' ? '(required)' : '(leave blank to keep current)' }}
                </span>
              </label>
              <Field id="password" name="password" type="password" class="erp-input" />
              <ErrorMessage name="password" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="max_discount">Max discount %</label>
              <Field id="max_discount" name="max_discount" type="number" min="0" max="100" class="erp-input" />
              <ErrorMessage name="max_discount" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create user' : 'Save changes' }}
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
import { useUsersStore } from '@stores/users'

const auth = useAuthStore()
const store = useUsersStore()

const roles = ['super_admin', 'admin', 'manager', 'cashier', 'accountant', 'hr']

const columns = [
  { key: 'full_name', label: 'User' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const alert = reactive({
  show: false,
  type: 'success',
  title: 'Success',
  message: '',
})

const modal = reactive({
  show: false,
  mode: 'create',
  user: null,
})

const deleteDialog = reactive({
  show: false,
  user: null,
  itemName: '',
})

const formKey = ref(0)

const formValues = computed(() => ({
  first_name: modal.user?.first_name ?? '',
  last_name: modal.user?.last_name ?? '',
  email: modal.user?.email ?? '',
  phone: modal.user?.phone ?? '',
  role: modal.user?.roles?.[0] ?? '',
  status: modal.user?.status ?? 'active',
  password: '',
  max_discount: modal.user?.max_discount ?? 0,
}))

const schema = computed(() =>
  yup.object({
    first_name: yup.string().required().max(100),
    last_name: yup.string().required().max(100),
    email: yup.string().email().required(),
    phone: yup.string().nullable(),
    role: yup.string().required(),
    status: yup.string().oneOf(['active', 'inactive', 'suspended']).required(),
    password:
      modal.mode === 'create'
        ? yup.string().required().min(8)
        : yup.string().nullable().transform((value) => value || null).min(8),
    max_discount: yup.number().min(0).max(100).required(),
  })
)

const openCreateModal = () => {
  modal.mode = 'create'
  modal.user = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (user) => {
  modal.mode = 'edit'
  modal.user = user
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.user = null
}

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : type === 'warning' ? 'Warning' : 'Success'
  alert.message = message
  alert.show = true
}

const openDeleteModal = (user) => {
  deleteDialog.show = true
  deleteDialog.user = user
  deleteDialog.itemName = user.full_name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.user = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchUsers({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchUsers({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchUsers({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    if (modal.mode === 'create') {
      await store.createUser(values)
      showToast('success', 'User created successfully.')
    } else {
      const payload = { ...values }

      if (!payload.password) {
        delete payload.password
      }

      await store.updateUser(modal.user.id, payload)
      showToast('success', 'User updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the user.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.user) {
    return
  }

  try {
    await store.deleteUser(deleteDialog.user.id)
    showToast('success', 'User deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the user.')
  }
}

const isCurrentUser = (user) => user.id === auth.user?.id

onMounted(async () => {
  if (auth.isLoggedIn && !auth.user) {
    await auth.fetchMe()
  }

  await store.fetchUsers()
})
</script>
