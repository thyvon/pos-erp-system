<template>
  <AppLayout
    :title="t('foundation.branchesPage.title')"
    :subtitle="t('foundation.branchesPage.subtitle')"
    :breadcrumbs="[
      { label: t('dashboard.breadcrumb'), to: '/dashboard' },
      { label: t('foundation.branchesPage.breadcrumb') },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        :title="t('foundation.branchesPage.tableTitle')"
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
            {{ t('foundation.branchesPage.newBranch') }}
          </button>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.code || t('foundation.branchesPage.noCode') }}</div>
          </div>
        </template>

        <template #manager="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.manager ? `${row.manager.first_name} ${row.manager.last_name || ''}`.trim() : t('foundation.branchesPage.unassigned') }}
          </div>
        </template>

        <template #status="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :status="row.is_active ? 'active' : 'inactive'" />
              <span v-if="row.is_default" class="erp-badge erp-badge-info px-3 uppercase tracking-[0.16em]">
                {{ t('foundation.branchesPage.defaultBadge') }}
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
        :title="modal.mode === 'create' ? t('foundation.branchesPage.createTitle') : t('foundation.branchesPage.editTitle')"
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
              <label class="erp-label" for="name">{{ t('foundation.branchesPage.fields.name') }}</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="code">{{ t('foundation.branchesPage.fields.code') }}</label>
              <Field id="code" name="code" class="erp-input" />
              <ErrorMessage name="code" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="type">{{ t('foundation.branchesPage.fields.type') }}</label>
              <AppSelect
                :model-value="values.type || null"
                :options="branchTypeOptions"
                clearable
                :placeholder="t('foundation.branchesPage.placeholders.selectType')"
                @update:model-value="setFieldValue('type', $event || '')"
              />
              <ErrorMessage name="type" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="manager_id">{{ t('foundation.branchesPage.fields.manager') }}</label>
              <AppSelect
                :model-value="values.manager_id || null"
                :options="managerSelectOptions"
                clearable
                searchable
                :placeholder="t('foundation.branchesPage.placeholders.noManager')"
                :search-placeholder="t('foundation.branchesPage.placeholders.searchManagers')"
                :empty-text="t('foundation.branchesPage.placeholders.noManagersFound')"
                @update:model-value="setFieldValue('manager_id', $event || '')"
              />
              <ErrorMessage name="manager_id" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="email">{{ t('foundation.branchesPage.fields.email') }}</label>
              <Field id="email" name="email" type="email" class="erp-input" />
              <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="phone">{{ t('foundation.branchesPage.fields.phone') }}</label>
              <Field id="phone" name="phone" class="erp-input" />
              <ErrorMessage name="phone" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="address_line1">{{ t('foundation.branchesPage.fields.addressLine1') }}</label>
              <Field id="address_line1" name="address.line1" class="erp-input" />
              <ErrorMessage name="address.line1" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="address_city">{{ t('foundation.branchesPage.fields.city') }}</label>
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
              <span>{{ t('foundation.branchesPage.toggles.defaultBranch') }}</span>
            </label>
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.is_active)"
                @change="setFieldValue('is_active', $event.target.checked)"
              />
              <span>{{ t('foundation.branchesPage.toggles.activeBranch') }}</span>
            </label>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">{{ t('confirmDelete.cancel') }}</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? t('foundation.branchesPage.createTitle') : t('foundation.branchesPage.saveButton') }}
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
import { getUsers } from '@api/users'
import { useAuthStore } from '@stores/auth'
import { useBranchesStore } from '@stores/branches'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const auth = useAuthStore()
const store = useBranchesStore()
const branchTypeOptions = computed(() => [
  { value: 'retail', label: t('foundation.branchesPage.types.retail') },
  { value: 'warehouse', label: t('foundation.branchesPage.types.warehouse') },
  { value: 'office', label: t('foundation.branchesPage.types.office') },
  { value: 'online', label: t('foundation.branchesPage.types.online') },
])

const canCreateBranch = computed(() => auth.can('branches.create'))
const canEditBranch = computed(() => auth.can('branches.edit'))
const canDeleteBranch = computed(() => auth.can('branches.delete'))
const showActionsColumn = computed(() => canEditBranch.value || canDeleteBranch.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: t('foundation.branchesPage.columns.branch') },
    { key: 'type', label: t('foundation.branchesPage.columns.type') },
    { key: 'manager', label: t('foundation.branchesPage.columns.manager') },
    { key: 'status', label: t('foundation.branchesPage.columns.status') },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: t('foundation.branchesPage.columns.actions') })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const modal = reactive({ show: false, mode: 'create', branch: null })
const deleteDialog = reactive({ show: false, branch: null, itemName: '' })
const managerOptions = ref([])
const managerSelectOptions = computed(() =>
  managerOptions.value.map((user) => ({
    value: user.id,
    label: user.full_name,
  }))
)
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
  alert.title = type === 'danger' ? t('common.error') : t('common.success')
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
      showToast('success', t('foundation.branchesPage.toast.created'))
    } else {
      await store.updateBranch(modal.branch.id, payload)
      showToast('success', t('foundation.branchesPage.toast.updated'))
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('foundation.branchesPage.toast.saveFailed'))
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.branch) return

  try {
    await store.deleteBranch(deleteDialog.branch.id)
    showToast('success', t('foundation.branchesPage.toast.deleted'))
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('foundation.branchesPage.toast.deleteFailed'))
  }
}

onMounted(async () => {
  await Promise.all([store.fetchBranches(), loadManagerOptions()])
})
</script>
