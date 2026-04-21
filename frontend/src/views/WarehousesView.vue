<template>
  <AppLayout
    :title="t('foundation.warehousesPage.title')"
    :subtitle="t('foundation.warehousesPage.subtitle')"
    :breadcrumbs="[
      { label: t('dashboard.breadcrumb'), to: '/dashboard' },
      { label: t('foundation.warehousesPage.breadcrumb') },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        :title="t('foundation.warehousesPage.tableTitle')"
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
          <button v-if="canCreateWarehouse" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            {{ t('foundation.warehousesPage.newWarehouse') }}
          </button>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.code || t('foundation.warehousesPage.noCode') }}</div>
          </div>
        </template>

        <template #branch="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.branch?.name || t('foundation.warehousesPage.noBranch') }}
          </div>
        </template>

        <template #status="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :status="row.is_active ? 'active' : 'inactive'" />
              <span v-if="row.is_default" class="erp-badge erp-badge-info px-3 uppercase tracking-[0.16em]">
                {{ t('foundation.warehousesPage.defaultBadge') }}
              </span>
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditWarehouse" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteWarehouse" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? t('foundation.warehousesPage.createTitle') : t('foundation.warehousesPage.editTitle')"
        icon="stock location"
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
              <label class="erp-label" for="name">{{ t('foundation.warehousesPage.fields.name') }}</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="code">{{ t('foundation.warehousesPage.fields.code') }}</label>
              <Field id="code" name="code" class="erp-input" />
              <ErrorMessage name="code" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="branch_id">{{ t('foundation.warehousesPage.fields.branch') }}</label>
              <AppSelect
                :model-value="values.branch_id || null"
                :options="branchSelectOptions"
                searchable
                clearable
                :placeholder="t('foundation.warehousesPage.placeholders.noBranch')"
                :search-placeholder="t('foundation.warehousesPage.placeholders.searchBranches')"
                :empty-text="t('foundation.warehousesPage.placeholders.noBranchesFound')"
                @update:model-value="setFieldValue('branch_id', $event || '')"
              />
              <ErrorMessage name="branch_id" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="type">{{ t('foundation.warehousesPage.fields.type') }}</label>
              <AppSelect
                :model-value="values.type || null"
                :options="warehouseTypeOptions"
                clearable
                :placeholder="t('foundation.warehousesPage.placeholders.selectType')"
                @update:model-value="setFieldValue('type', $event || '')"
              />
              <ErrorMessage name="type" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-3">
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.is_default)"
                @change="setFieldValue('is_default', $event.target.checked)"
              />
              <span>{{ t('foundation.warehousesPage.toggles.defaultWarehouse') }}</span>
            </label>
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.is_active)"
                @change="setFieldValue('is_active', $event.target.checked)"
              />
              <span>{{ t('foundation.warehousesPage.toggles.activeWarehouse') }}</span>
            </label>
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.allow_negative_stock)"
                @change="setFieldValue('allow_negative_stock', $event.target.checked)"
              />
              <span>{{ t('foundation.warehousesPage.toggles.allowNegativeStock') }}</span>
            </label>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">{{ t('confirmDelete.cancel') }}</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? t('foundation.warehousesPage.createTitle') : t('foundation.warehousesPage.saveButton') }}
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
import { getBranches } from '@api/branches'
import { useAuthStore } from '@stores/auth'
import { useWarehousesStore } from '@stores/warehouses'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const auth = useAuthStore()
const store = useWarehousesStore()

const canCreateWarehouse = computed(() => auth.can('warehouses.create'))
const canEditWarehouse = computed(() => auth.can('warehouses.edit'))
const canDeleteWarehouse = computed(() => auth.can('warehouses.delete'))
const showActionsColumn = computed(() => canEditWarehouse.value || canDeleteWarehouse.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: t('foundation.warehousesPage.columns.warehouse') },
    { key: 'type', label: t('foundation.warehousesPage.columns.type') },
    { key: 'branch', label: t('foundation.warehousesPage.columns.branch') },
    { key: 'status', label: t('foundation.warehousesPage.columns.status') },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: t('foundation.warehousesPage.columns.actions') })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const modal = reactive({ show: false, mode: 'create', warehouse: null })
const deleteDialog = reactive({ show: false, warehouse: null, itemName: '' })
const branchOptions = ref([])
const warehouseTypeOptions = computed(() => [
  { value: 'main', label: t('foundation.warehousesPage.types.main') },
  { value: 'transit', label: t('foundation.warehousesPage.types.transit') },
  { value: 'returns', label: t('foundation.warehousesPage.types.returns') },
  { value: 'damaged', label: t('foundation.warehousesPage.types.damaged') },
])
const branchSelectOptions = computed(() => branchOptions.value.map((branch) => ({
  value: branch.id,
  label: branch.name,
})))
const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.warehouse?.name ?? '',
  code: modal.warehouse?.code ?? '',
  branch_id: modal.warehouse?.branch?.id ?? '',
  type: modal.warehouse?.type ?? '',
  is_default: modal.warehouse?.is_default ?? false,
  is_active: modal.warehouse?.is_active ?? true,
  allow_negative_stock: modal.warehouse?.allow_negative_stock ?? false,
}))

const schema = yup.object({
  name: yup.string().required().max(255),
  code: yup.string().nullable().max(50),
  branch_id: yup.string().nullable(),
  type: yup.string().nullable(),
  is_default: yup.boolean().nullable(),
  is_active: yup.boolean().nullable(),
  allow_negative_stock: yup.boolean().nullable(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? t('common.error') : t('common.success')
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const loadBranchOptions = async () => {
  try {
    const response = await getBranches({ per_page: 100 })
    branchOptions.value = response.data.data.map((branch) => ({
      id: branch.id,
      name: branch.name,
    }))
  } catch {
    branchOptions.value = []
  }
}

const openCreateModal = () => {
  if (!canCreateWarehouse.value) return
  modal.mode = 'create'
  modal.warehouse = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (warehouse) => {
  if (!canEditWarehouse.value) return
  modal.mode = 'edit'
  modal.warehouse = warehouse
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.warehouse = null
}

const openDeleteModal = (warehouse) => {
  if (!canDeleteWarehouse.value) return
  deleteDialog.show = true
  deleteDialog.warehouse = warehouse
  deleteDialog.itemName = warehouse.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.warehouse = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchWarehouses({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchWarehouses({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchWarehouses({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      ...values,
      is_default: Boolean(values.is_default),
      is_active: Boolean(values.is_active),
      allow_negative_stock: Boolean(values.allow_negative_stock),
    }

    if (modal.mode === 'create') {
      await store.createWarehouse(payload)
      showToast('success', t('foundation.warehousesPage.toast.created'))
    } else {
      await store.updateWarehouse(modal.warehouse.id, payload)
      showToast('success', t('foundation.warehousesPage.toast.updated'))
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('foundation.warehousesPage.toast.saveFailed'))
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.warehouse) return

  try {
    await store.deleteWarehouse(deleteDialog.warehouse.id)
    showToast('success', t('foundation.warehousesPage.toast.deleted'))
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('foundation.warehousesPage.toast.deleteFailed'))
  }
}

onMounted(async () => {
  await Promise.all([store.fetchWarehouses(), loadBranchOptions()])
})
</script>
