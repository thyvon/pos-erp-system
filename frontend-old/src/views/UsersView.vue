<template>
  <AppLayout
    :title="t('usersPage.title')"
    :subtitle="t('usersPage.subtitle')"
    :breadcrumbs="[
      { label: t('dashboard.breadcrumb'), to: '/dashboard' },
      { label: t('usersPage.breadcrumb') },
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
        :title="t('usersPage.tableTitle')"
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
          <button v-if="canCreateUser" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            {{ t('usersPage.newUser') }}
          </button>
        </template>

        <template #full_name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.full_name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.phone || t('usersPage.noPhone') }}</div>
          </div>
        </template>

        <template #role="{ row }">
          <span class="erp-badge erp-badge-info px-3 uppercase tracking-[0.16em]">
            {{ row.roles?.[0] || t('usersPage.notApplicable') }}
          </span>
        </template>

        <template #default_branch="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            {{ row.default_branch?.name || t('usersPage.notSet') }}
          </div>
        </template>

        <template #branches="{ row }">
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="branch in (row.branches || []).slice(0, 2)"
              :key="branch.id"
              class="erp-badge erp-badge-neutral px-2 text-[11px] font-medium"
            >
              {{ branch.name }}
            </span>
            <span
              v-if="(row.branches || []).length > 2"
              class="erp-badge erp-badge-neutral px-2 text-[11px] font-medium"
            >
              +{{ row.branches.length - 2 }}
            </span>
          </div>
        </template>

        <template #status="{ row }">
          <StatusBadge :status="row.status" :label="statusLabel(row.status)" />
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditUser" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              v-if="canDeleteUser"
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
        :title="modal.mode === 'create' ? t('usersPage.createUser') : t('usersPage.editUser')"
        icon="user account"
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
            <div class="erp-form-grid">
              <div>
                <label class="erp-label" for="first_name">{{ t('usersPage.firstName') }}</label>
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
                <label class="erp-label" for="email">{{ t('usersPage.email') }}</label>
                <Field id="email" name="email" type="email" class="erp-input" />
                <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>

              <div>
                <label class="erp-label" for="phone">Phone</label>
                <Field id="phone" name="phone" class="erp-input" />
                <ErrorMessage name="phone" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>
            </div>

            <div class="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <section class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {{ t('usersPage.roleSectionTitle') }}
                    </div>
                    <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ t('usersPage.roleSectionHint') }}</div>
                  </div>
                </div>

                <div class="mt-4 space-y-4">
                  <div class="erp-form-grid">
                    <div>
                      <label class="erp-label" for="role">Role</label>
                      <AppSelect
                        :model-value="values.role || null"
                        :options="roleOptions"
                        searchable
                        :placeholder="t('usersPage.selectRole')"
                        :search-placeholder="t('usersPage.searchRoles')"
                        :empty-text="t('usersPage.noRolesFound')"
                        @update:model-value="handleRoleChange(setFieldValue, $event)"
                      />
                      <ErrorMessage name="role" class="erp-helper text-rose-500 dark:text-rose-400" />
                    </div>

                    <div>
                      <label class="erp-label" for="status">{{ t('usersPage.status') }}</label>
                      <AppSelect
                        :model-value="values.status || null"
                        :options="statusOptions"
                        :placeholder="t('usersPage.status')"
                        @update:model-value="setFieldValue('status', $event || 'active')"
                      />
                      <ErrorMessage name="status" class="erp-helper text-rose-500 dark:text-rose-400" />
                    </div>
                  </div>

                  <div>
                    <div class="erp-label">Role permissions</div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span
                        v-for="permission in selectedRolePermissions(values.role)"
                        :key="permission"
                        class="erp-badge erp-badge-info text-[11px] font-medium"
                      >
                        {{ permission }}
                      </span>
                      <span
                        v-if="selectedRolePermissions(values.role).length === 0"
                        class="text-sm text-slate-500 dark:text-slate-400"
                      >
                        {{ t('usersPage.selectRolePreview') }}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div class="erp-label">{{ t('usersPage.extraPermissions') }}</div>
                    <div class="mt-3">
                      <AppSelect
                        :model-value="values.direct_permissions"
                        :options="permissionOptions"
                        multiple
                        searchable
                        clearable
                        :placeholder="t('usersPage.selectPermissions')"
                        :search-placeholder="t('usersPage.searchPermissions')"
                        :empty-text="t('usersPage.noPermissionsFound')"
                        @update:model-value="setFieldValue('direct_permissions', $event)"
                      />
                      <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {{ t('usersPage.extraPermissionsHelp') }}
                      </div>
                      <div
                        v-if="values.direct_permissions.length"
                        class="mt-3 flex flex-wrap gap-2"
                      >
                          <span v-for="permission in values.direct_permissions" :key="permission" class="erp-badge erp-badge-neutral text-[11px] font-medium">
                            {{ permission }}
                          </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                <div>
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Branch access</div>
                  <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">Users can only access the branches assigned here.</div>
                  <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('usersPage.branchAccessOptional') }}</div>
                </div>

                <div v-if="roleUsesScopedBranchAccess(values.role)" class="mt-4 space-y-4">
                  <div>
                    <label class="erp-label" for="default_branch_id">{{ t('usersPage.defaultBranch') }}</label>
                    <AppSelect
                      :model-value="values.default_branch_id || null"
                      :options="defaultBranchOptions(values.branch_ids)"
                      clearable
                      :placeholder="t('usersPage.selectDefaultBranch')"
                      @update:model-value="setFieldValue('default_branch_id', $event || '')"
                    />
                    <ErrorMessage name="default_branch_id" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div>
                    <div class="erp-label">{{ t('usersPage.assignedBranches') }}</div>
                    <div class="mt-3 space-y-2">
                      <label
                        v-for="branch in branches"
                        :key="branch.id"
                        class="flex items-center justify-between gap-3 rounded-[5px] border border-slate-200/70 px-3 py-2.5 text-sm dark:border-slate-800/70"
                      >
                        <div class="flex items-center gap-3">
                          <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            :checked="values.branch_ids.includes(branch.id)"
                            @change="toggleBranchSelection(branch.id, values, setFieldValue, $event.target.checked)"
                          />
                          <div>
                            <div class="font-medium text-slate-800 dark:text-slate-100">{{ branch.name }}</div>
                            <div class="text-xs text-slate-500 dark:text-slate-400">{{ branch.code }}</div>
                          </div>
                        </div>
                        <span v-if="branch.is_default" class="erp-badge erp-badge-success px-2 text-[11px] font-medium">
                          {{ t('usersPage.businessDefault') }}
                        </span>
                      </label>
                    </div>
                    <ErrorMessage name="branch_ids" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                </div>
                <div
                  v-else
                  class="mt-4 rounded-[5px] border border-cyan-200/80 bg-cyan-50/80 px-3 py-2 text-sm text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-300"
                >
                  {{ t('usersPage.branchAccessNotUsed') }}
                </div>
              </section>
            </div>

            <div class="erp-form-grid">
              <div>
                <label class="erp-label" for="password">
                  {{ t('usersPage.password') }}
                  <span class="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    {{ modal.mode === 'create' ? t('usersPage.passwordRequiredHint') : t('usersPage.passwordOptionalHint') }}
                  </span>
                </label>
                <Field id="password" name="password" type="password" class="erp-input" />
                <ErrorMessage name="password" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>

              <div>
                <label class="erp-label" for="max_discount">{{ t('usersPage.maxDiscount') }}</label>
                <Field id="max_discount" name="max_discount" type="number" min="0" max="100" class="erp-input" />
                <ErrorMessage name="max_discount" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>
            </div>

            <div class="erp-form-grid">
              <div>
                <label class="erp-label" for="commission_percentage">{{ t('usersPage.commission') }}</label>
                <Field id="commission_percentage" name="commission_percentage" type="number" min="0" max="100" class="erp-input" />
                <ErrorMessage name="commission_percentage" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>

              <div>
                <label class="erp-label" for="sales_target_amount">{{ t('usersPage.monthlySalesTarget') }}</label>
                <Field id="sales_target_amount" name="sales_target_amount" type="number" min="0" class="erp-input" />
                <ErrorMessage name="sales_target_amount" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>
            </div>

            <div class="erp-form-actions">
              <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">
                {{ t('usersPage.cancel') }}
              </button>
              <button type="submit" class="erp-button-primary" :disabled="store.saving || store.optionsLoading">
                <span
                  v-if="store.saving"
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                ></span>
                {{ modal.mode === 'create' ? t('usersPage.createUser') : t('usersPage.saveChanges') }}
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
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import StatusBadge from '@components/ui/StatusBadge.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@stores/auth'
import { useUsersStore } from '@stores/users'

const { t } = useI18n()
const auth = useAuthStore()
const store = useUsersStore()

const canCreateUser = computed(() => auth.can('users.create'))
const canEditUser = computed(() => auth.can('users.edit'))
const canDeleteUser = computed(() => auth.can('users.delete'))
const showActionsColumn = computed(() => canEditUser.value || canDeleteUser.value)
const roles = computed(() => store.accessOptions.roles || [])
const branches = computed(() => store.accessOptions.branches || [])
const permissionGroups = computed(() => store.accessOptions.permissions || [])
const roleOptions = computed(() => roles.value.map((role) => ({
  value: role.name,
  label: role.name,
})))
const statusOptions = computed(() => [
  { value: 'active', label: t('usersPage.statusActive') },
  { value: 'inactive', label: t('usersPage.statusInactive') },
  { value: 'suspended', label: t('usersPage.statusSuspended') },
])
const permissionOptions = computed(() =>
  permissionGroups.value.flatMap((group) =>
    group.permissions.map((permission) => ({
      value: permission,
      label: permission,
      group: group.group,
      keywords: `${group.group} ${permission}`,
    }))
  )
)

const columns = computed(() => {
  const baseColumns = [
    { key: 'full_name', label: t('usersPage.columns.user') },
    { key: 'email', label: t('usersPage.columns.email') },
    { key: 'role', label: t('usersPage.columns.role') },
    { key: 'default_branch', label: t('usersPage.columns.defaultBranch') },
    { key: 'branches', label: t('usersPage.columns.branchAccess') },
    { key: 'status', label: t('usersPage.columns.status') },
  ]

  if (showActionsColumn.value) {
    baseColumns.push({ key: 'actions', label: t('usersPage.columns.actions') })
  }

  return baseColumns
})

const alert = reactive({
  show: false,
  type: 'success',
  title: '',
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
  commission_percentage: modal.user?.commission_percentage ?? 0,
  sales_target_amount: modal.user?.sales_target_amount ?? 0,
  direct_permissions: modal.user?.direct_permissions ?? [],
  branch_ids: modal.user?.branch_ids ?? [],
  default_branch_id: modal.user?.default_branch_id ?? '',
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
    commission_percentage: yup.number().min(0).max(100).required(),
    sales_target_amount: yup.number().min(0).required(),
    direct_permissions: yup.array().of(yup.string()).default([]),
    branch_ids: yup.array().of(yup.string()).default([]),
    default_branch_id: yup.string().nullable().transform((value) => value || null),
  })
)

const showToast = (type, message) => {
  alert.type = type
  alert.title =
    type === 'danger' ? t('common.error') : type === 'warning' ? t('common.warning') : t('common.success')
  alert.message = message
  alert.show = true
}

const statusLabel = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'active') {
    return t('usersPage.statusActive')
  }
  if (s === 'inactive') {
    return t('usersPage.statusInactive')
  }
  if (s === 'suspended') {
    return t('usersPage.statusSuspended')
  }

  return String(status || '')
}

const selectedRolePermissions = (roleName) =>
  roles.value.find((role) => role.name === roleName)?.permissions || []

const selectedBranches = (branchIds = []) =>
  branches.value.filter((branch) => branchIds.includes(branch.id))

const defaultBranchOptions = (branchIds = []) =>
  selectedBranches(branchIds).map((branch) => ({
    value: branch.id,
    label: branch.name,
  }))

const roleUsesScopedBranchAccess = (roleName) => !['super_admin', 'admin'].includes(roleName || '')

const toggleBranchSelection = (branchId, values, setFieldValue, checked) => {
  const nextBranchIds = new Set(values.branch_ids || [])

  if (checked) {
    nextBranchIds.add(branchId)
  } else {
    nextBranchIds.delete(branchId)
  }

  const normalizedBranchIds = Array.from(nextBranchIds)
  setFieldValue('branch_ids', normalizedBranchIds)

  if (!normalizedBranchIds.includes(values.default_branch_id)) {
    setFieldValue('default_branch_id', normalizedBranchIds[0] || '')
  }
}

const handleRoleChange = (setFieldValue, roleName) => {
  setFieldValue('role', roleName)

  if (!roleUsesScopedBranchAccess(roleName)) {
    setFieldValue('branch_ids', [])
    setFieldValue('default_branch_id', '')
  }
}

const openCreateModal = () => {
  if (!canCreateUser.value) {
    return
  }

  modal.mode = 'create'
  modal.user = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (user) => {
  if (!canEditUser.value) {
    return
  }

  modal.mode = 'edit'
  modal.user = user
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.user = null
}

const openDeleteModal = (user) => {
  if (!canDeleteUser.value) {
    return
  }

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
    const normalizedBranchIds = [...new Set(values.branch_ids || [])]
    const payload = {
      ...values,
      direct_permissions: [...new Set(values.direct_permissions || [])],
      branch_ids: normalizedBranchIds,
    }

    if (!roleUsesScopedBranchAccess(payload.role)) {
      payload.branch_ids = []
      payload.default_branch_id = null
    } else if (!normalizedBranchIds.includes(payload.default_branch_id)) {
      payload.default_branch_id = normalizedBranchIds[0] || null
    }

    if (modal.mode === 'create') {
      await store.createUser(payload)
      showToast('success', t('usersPage.toast.created'))
    } else {
      if (!payload.password) {
        delete payload.password
      }

      await store.updateUser(modal.user.id, payload)
      showToast('success', t('usersPage.toast.updated'))
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('usersPage.toast.saveFailed'))
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.user) {
    return
  }

  try {
    await store.deleteUser(deleteDialog.user.id)
    showToast('success', t('usersPage.toast.deleted'))
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('usersPage.toast.deleteFailed'))
  }
}

const isCurrentUser = (user) => user.id === auth.user?.id

onMounted(async () => {
  if (auth.isLoggedIn && !auth.user) {
    await auth.fetchMe()
  }

  await Promise.all([
    store.fetchAccessOptions(),
    store.fetchUsers(),
  ])
})
</script>
