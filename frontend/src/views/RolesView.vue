<template>
  <AppLayout
    title="Roles"
    subtitle="Manage role definitions and the permissions each role grants."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Roles' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Roles"
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
          <button v-if="canCreateRole" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New role
          </button>
        </template>

        <template #name="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</span>
              <span v-if="row.is_protected" class="erp-badge erp-badge-warning px-2 text-[11px] font-medium">
                Protected
              </span>
          </div>
        </template>

        <template #permissions_count="{ row }">
          <span class="text-sm text-slate-700 dark:text-slate-200">{{ row.permissions_count }}</span>
        </template>

        <template #users_count="{ row }">
          <span class="text-sm text-slate-700 dark:text-slate-200">{{ row.users_count }}</span>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditRole" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              v-if="canDeleteRole"
              type="button"
              class="erp-button-icon"
              :disabled="row.is_protected || row.users_count > 0"
              @click="openDeleteModal(row)"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create role' : 'Edit role'"
        icon="user shield"
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
          <div class="space-y-6">
            <div>
              <label class="erp-label" for="name">Role name</label>
              <Field id="name" name="name" class="erp-input" :disabled="modal.role?.is_protected" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
              <p v-if="modal.role?.is_protected" class="erp-helper">
                Protected system roles can keep their name, but their permissions can still be adjusted here.
              </p>
            </div>

            <div class="space-y-4">
              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Permission matrix
              </div>

              <div
                v-for="group in permissionGroups"
                :key="group.group"
                class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
              >
                <div class="text-sm font-semibold text-slate-900 dark:text-white">{{ group.group }}</div>
                <div class="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <label
                    v-for="permission in group.permissions"
                    :key="permission"
                    class="flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <input
                      :id="`permission-${permission}`"
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      :checked="values.permissions.includes(permission)"
                      @change="togglePermission(permission, values.permissions, setFieldValue, $event.target.checked)"
                    />
                    <span>{{ permission }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="erp-form-actions">
              <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">
                Cancel
              </button>
              <button type="submit" class="erp-button-primary" :disabled="store.saving || store.optionsLoading">
                <span
                  v-if="store.saving"
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                ></span>
                {{ modal.mode === 'create' ? 'Create role' : 'Save changes' }}
              </button>
            </div>
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
import { useRolesStore } from '@stores/roles'

const auth = useAuthStore()
const store = useRolesStore()

const canCreateRole = computed(() => auth.can('roles.create'))
const canEditRole = computed(() => auth.can('roles.edit'))
const canDeleteRole = computed(() => auth.can('roles.delete'))
const showActionsColumn = computed(() => canEditRole.value || canDeleteRole.value)
const permissionGroups = computed(() => store.options.permissions || [])

const columns = computed(() => {
  const baseColumns = [
    { key: 'name', label: 'Role' },
    { key: 'permissions_count', label: 'Permissions' },
    { key: 'users_count', label: 'Assigned Users' },
  ]

  if (showActionsColumn.value) {
    baseColumns.push({ key: 'actions', label: 'Actions' })
  }

  return baseColumns
})

const alert = reactive({
  show: false,
  type: 'success',
  title: 'Success',
  message: '',
})

const modal = reactive({
  show: false,
  mode: 'create',
  role: null,
})

const deleteDialog = reactive({
  show: false,
  role: null,
  itemName: '',
})

const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.role?.name ?? '',
  permissions: modal.role?.permissions ?? [],
}))

const schema = computed(() =>
  yup.object({
    name: yup.string().required().max(125),
    permissions: yup.array().of(yup.string()).default([]),
  })
)

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = true
}

const togglePermission = (permission, currentPermissions, setFieldValue, checked) => {
  const nextPermissions = new Set(currentPermissions || [])

  if (checked) {
    nextPermissions.add(permission)
  } else {
    nextPermissions.delete(permission)
  }

  setFieldValue('permissions', Array.from(nextPermissions))
}

const openCreateModal = () => {
  if (!canCreateRole.value) {
    return
  }

  modal.mode = 'create'
  modal.role = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (role) => {
  if (!canEditRole.value) {
    return
  }

  modal.mode = 'edit'
  modal.role = role
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.role = null
}

const openDeleteModal = (role) => {
  if (!canDeleteRole.value || role.is_protected || role.users_count > 0) {
    return
  }

  deleteDialog.show = true
  deleteDialog.role = role
  deleteDialog.itemName = role.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.role = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchRoles({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchRoles({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchRoles({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      ...values,
      permissions: [...new Set(values.permissions || [])],
    }

    if (modal.mode === 'create') {
      await store.createRole(payload)
      showToast('success', 'Role created successfully.')
    } else {
      await store.updateRole(modal.role.id, payload)
      showToast('success', 'Role updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the role.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.role) {
    return
  }

  try {
    await store.deleteRole(deleteDialog.role.id)
    showToast('success', 'Role deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the role.')
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchOptions(),
    store.fetchRoles(),
  ])
})
</script>
