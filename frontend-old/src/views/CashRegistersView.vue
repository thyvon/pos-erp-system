<template>
  <AppLayout
    :title="t('sales.registersPage.title')"
    :subtitle="t('sales.registersPage.subtitle')"
    :breadcrumbs="[
      { label: t('layout.nav.dashboard.label'), to: '/dashboard' },
      { label: t('layout.nav.sales.label') },
      { label: t('sales.registersPage.breadcrumb') },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <FilterPanel
        v-model:expanded="filtersExpanded"
        :title="t('sales.shared.filters.title')"
        :description="t('sales.registersPage.filterDescription')"
        :active-count="activeFilterCount"
        :show-clear="activeFilterCount > 0"
        @clear="resetFilters"
      >
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label class="erp-label">{{ t('sales.shared.filters.branch') }}</label>
            <AppSelect
              :model-value="store.filters.branch_id || null"
              :options="branchOptions"
              :placeholder="t('sales.shared.placeholders.allBranches')"
              clearable
              searchable
              @update:model-value="handleBranchFilter"
            />
          </div>
          <div>
            <label class="erp-label">{{ t('sales.shared.filters.status') }}</label>
            <AppSelect
              :model-value="store.filters.status || null"
              :options="statusOptions"
              :placeholder="t('sales.shared.placeholders.allStatuses')"
              clearable
              @update:model-value="handleStatusFilter"
            />
          </div>
        </div>
      </FilterPanel>

      <DataTable
        :title="t('sales.registersPage.tableTitle')"
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
          <button v-if="canManageRegisters" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            {{ t('sales.registersPage.newRegister') }}
          </button>
        </template>

        <template #register="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.branch?.name || t('sales.shared.notRecorded') }}
            </div>
          </div>
        </template>

        <template #session="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <template v-if="row.current_open_session">
              <div class="font-semibold text-emerald-700 dark:text-emerald-300">{{ t('sales.registersPage.openSession') }}</div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ row.current_open_session.user?.name || t('sales.shared.notRecorded') }}
              </div>
            </template>
            <template v-else>
              <div>{{ t('sales.registersPage.noOpenSession') }}</div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ row.sessions_count }} {{ t('sales.registersPage.totalSessions') }}
              </div>
            </template>
          </div>
        </template>

        <template #activity="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <span class="erp-badge" :class="row.is_active ? 'erp-badge-success' : 'erp-badge-neutral'">
              {{ row.is_active ? t('sales.shared.statuses.active') : t('sales.shared.statuses.inactive') }}
            </span>
            <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {{ formatHumanDateTime(row.updated_at) }}
            </div>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="canOpenOrClose && !row.current_open_session"
              type="button"
              class="erp-button-secondary"
              :disabled="store.saving"
              @click="openSessionModal(row)"
            >
              {{ t('sales.shared.actions.openSession') }}
            </button>
            <button
              v-if="canOpenOrClose && row.current_open_session"
              type="button"
              class="erp-button-secondary"
              :disabled="store.saving"
              @click="closeSessionPrompt(row)"
            >
              {{ t('sales.shared.actions.closeSession') }}
            </button>
            <button
              v-if="canManageRegisters"
              type="button"
              class="erp-button-secondary"
              :disabled="store.saving"
              @click="openEditModal(row)"
            >
              {{ t('sales.shared.actions.edit') }}
            </button>
            <button
              v-if="canManageRegisters"
              type="button"
              class="erp-button-secondary text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
              :disabled="store.deletingId === row.id"
              @click="openDeleteModal(row)"
            >
              {{ t('sales.shared.actions.delete') }}
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal :show="registerModal.show" :title="registerModal.mode === 'create' ? t('sales.registersPage.createTitle') : t('sales.registersPage.editTitle')" :icon="t('sales.registersPage.modalIcon')" size="lg" @close="closeRegisterModal">
        <div class="space-y-4">
          <div>
            <label class="erp-label">{{ t('sales.documentModal.fields.branch') }}</label>
            <AppSelect
              :model-value="registerModal.form.branch_id || null"
              :options="branchOptions"
              :placeholder="t('sales.documentModal.placeholders.selectBranch')"
              searchable
              @update:model-value="registerModal.form.branch_id = $event || ''"
            />
          </div>
          <div>
            <label class="erp-label">{{ t('sales.registersPage.fields.name') }}</label>
            <input v-model="registerModal.form.name" type="text" class="erp-input" />
          </div>
          <label class="flex items-center gap-3 rounded-[16px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <input
              :checked="registerModal.form.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              @change="registerModal.form.is_active = $event.target.checked"
            />
            <span>{{ t('sales.registersPage.fields.isActive') }}</span>
          </label>
          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeRegisterModal">
              {{ t('sales.shared.actions.cancel') }}
            </button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitRegister">
              {{ t('sales.shared.actions.save') }}
            </button>
          </div>
        </div>
      </AppModal>

      <AppModal :show="sessionModal.show" :title="sessionModal.mode === 'open' ? t('sales.registersPage.openSessionTitle') : t('sales.registersPage.closeSessionTitle')" :icon="t('sales.registersPage.sessionIcon')" size="lg" @close="closeSessionModal">
        <div class="space-y-4">
          <div class="text-sm text-slate-600 dark:text-slate-300">{{ sessionModal.register?.name }}</div>
          <div>
            <label class="erp-label">
              {{ sessionModal.mode === 'open' ? t('sales.registersPage.fields.openingFloat') : t('sales.registersPage.fields.closingFloat') }}
            </label>
            <input v-model.number="sessionModal.form.amount" type="number" min="0" step="0.01" class="erp-input" />
          </div>
          <div>
            <label class="erp-label">{{ t('sales.salesPage.fields.note') }}</label>
            <textarea v-model="sessionModal.form.notes" rows="3" class="erp-input min-h-[6rem]"></textarea>
          </div>
          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeSessionModal">
              {{ t('sales.shared.actions.cancel') }}
            </button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitSession">
              {{ sessionModal.mode === 'open' ? t('sales.shared.actions.openSession') : t('sales.shared.actions.closeSession') }}
            </button>
          </div>
        </div>
      </AppModal>

      <ConfirmDelete
        :show="deleteDialog.show"
        :item-name="deleteDialog.itemName"
        :loading="store.deletingId === deleteDialog.itemId"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as branchesApi from '@api/branches'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useCashRegistersStore } from '@stores/sales'
import { formatHumanDateTime } from '@/utils/date'

const { t } = useI18n()
const auth = useAuthStore()
const store = useCashRegistersStore()

const filtersExpanded = ref(false)
const branches = ref([])

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const registerModal = reactive({ show: false, mode: 'create', register: null, form: { branch_id: '', name: '', is_active: true } })
const sessionModal = reactive({ show: false, mode: 'open', register: null, session: null, form: { amount: 0, notes: '' } })
const deleteDialog = reactive({ show: false, itemId: '', itemName: '' })

const canManageRegisters = computed(() => auth.can('sales.edit') && auth.hasRole(['admin', 'manager']))
const canOpenOrClose = computed(() => auth.can('sales.create') && auth.hasRole(['admin', 'manager', 'cashier']))

const columns = [
  { key: 'register', label: 'Register' },
  { key: 'session', label: 'Session' },
  { key: 'activity', label: 'Activity' },
  { key: 'actions', label: 'Actions' },
]

const branchOptions = computed(() =>
  branches.value.map((branch) => ({
    value: branch.id,
    label: branch.name,
    description: branch.code || '',
  }))
)

const statusOptions = computed(() => [
  { value: 'active', label: t('sales.shared.statuses.active') },
  { value: 'inactive', label: t('sales.shared.statuses.inactive') },
])

const activeFilterCount = computed(() =>
  [store.filters.branch_id, store.filters.status].filter(Boolean).length
)

const showToast = (type, message) => {
  alert.type = type
  alert.title = t(type === 'danger' ? 'sales.shared.toast.errorTitle' : 'sales.shared.toast.successTitle')
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const loadBranches = async () => {
  if (!auth.isBranchScopeBypassed) {
    branches.value = auth.allowedBranches.map((branch) => ({ ...branch }))
    return
  }

  try {
    const response = await branchesApi.getBranches({ per_page: 250 })
    branches.value = response.data.data
  } catch {
    branches.value = []
  }
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })
const handleBranchFilter = (value) => store.fetchItems({ branch_id: value || '', page: 1 })
const handleStatusFilter = (value) => store.fetchItems({ status: value || '', page: 1 })

const resetFilters = () => {
  store.fetchItems({ branch_id: '', status: '', page: 1 })
}

const openCreateModal = () => {
  registerModal.show = true
  registerModal.mode = 'create'
  registerModal.register = null
  registerModal.form.branch_id = branches.value[0]?.id || ''
  registerModal.form.name = ''
  registerModal.form.is_active = true
}

const openEditModal = (register) => {
  registerModal.show = true
  registerModal.mode = 'edit'
  registerModal.register = register
  registerModal.form.branch_id = register.branch_id
  registerModal.form.name = register.name
  registerModal.form.is_active = Boolean(register.is_active)
}

const closeRegisterModal = () => {
  registerModal.show = false
  registerModal.register = null
}

const submitRegister = async () => {
  if (!registerModal.form.branch_id || !registerModal.form.name.trim()) {
    showToast('danger', t('sales.registersPage.toast.invalidRegister'))
    return
  }

  try {
    if (registerModal.mode === 'create') {
      await store.createItem({
        branch_id: registerModal.form.branch_id,
        name: registerModal.form.name.trim(),
        is_active: registerModal.form.is_active,
      })
      showToast('success', t('sales.registersPage.toast.created'))
    } else {
      await store.updateItem(registerModal.register.id, {
        branch_id: registerModal.form.branch_id,
        name: registerModal.form.name.trim(),
        is_active: registerModal.form.is_active,
      })
      showToast('success', t('sales.registersPage.toast.updated'))
    }
    closeRegisterModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.registersPage.toast.saveFailed'))
  }
}

const openSessionModal = (register) => {
  sessionModal.show = true
  sessionModal.mode = 'open'
  sessionModal.register = register
  sessionModal.session = null
  sessionModal.form.amount = 0
  sessionModal.form.notes = ''
}

const closeSessionPrompt = (register) => {
  sessionModal.show = true
  sessionModal.mode = 'close'
  sessionModal.register = register
  sessionModal.session = register.current_open_session
  sessionModal.form.amount = Number(register.current_open_session?.opening_float || 0)
  sessionModal.form.notes = ''
}

const closeSessionModal = () => {
  sessionModal.show = false
  sessionModal.register = null
  sessionModal.session = null
}

const submitSession = async () => {
  if (!sessionModal.register) {
    return
  }

  try {
    if (sessionModal.mode === 'open') {
      await store.openSession(sessionModal.register.id, {
        opening_float: Number(sessionModal.form.amount || 0),
        notes: sessionModal.form.notes || null,
      })
      showToast('success', t('sales.registersPage.toast.sessionOpened'))
    } else {
      await store.closeSession(sessionModal.session.id, {
        closing_float: Number(sessionModal.form.amount || 0),
        notes: sessionModal.form.notes || null,
      })
      showToast('success', t('sales.registersPage.toast.sessionClosed'))
    }
    closeSessionModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.registersPage.toast.sessionFailed'))
  }
}

const openDeleteModal = (register) => {
  deleteDialog.show = true
  deleteDialog.itemId = register.id
  deleteDialog.itemName = register.name
}

const closeDeleteModal = () => {
  if (store.deletingId) {
    return
  }

  deleteDialog.show = false
  deleteDialog.itemId = ''
  deleteDialog.itemName = ''
}

const confirmDelete = async () => {
  if (!deleteDialog.itemId) {
    return
  }

  try {
    await store.deleteItem(deleteDialog.itemId)
    closeDeleteModal()
    showToast('success', t('sales.registersPage.toast.deleted'))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.registersPage.toast.deleteFailed'))
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchItems(),
    loadBranches(),
  ])
})
</script>
