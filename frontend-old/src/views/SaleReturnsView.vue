<template>
  <AppLayout
    :title="t('sales.returnsPage.title')"
    :subtitle="t('sales.returnsPage.subtitle')"
    :breadcrumbs="[
      { label: t('layout.nav.dashboard.label'), to: '/dashboard' },
      { label: t('layout.nav.sales.label') },
      { label: t('sales.returnsPage.breadcrumb') },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <FilterPanel
        v-model:expanded="filtersExpanded"
        :title="t('sales.shared.filters.title')"
        :description="t('sales.returnsPage.filterDescription')"
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
        </div>
      </FilterPanel>

      <DataTable
        :title="t('sales.returnsPage.tableTitle')"
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
        <template #return="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.return_number }}</div>
            <div class="mt-1">
              <span class="erp-badge erp-badge-success">{{ t(`sales.shared.statuses.${row.status}`) }}</span>
            </div>
          </div>
        </template>

        <template #sale="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.sale?.sale_number || t('sales.shared.notRecorded') }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.branch?.name || t('sales.shared.notRecorded') }}
            </div>
          </div>
        </template>

        <template #refund="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ refundMethodLabel(row.refund_method) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.items_count }} {{ t('sales.shared.labels.lines') }}
            </div>
          </div>
        </template>

        <template #amount="{ row }">
          <div class="font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(row.total_amount) }}</div>
        </template>

        <template #date="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ formatHumanDate(row.return_date) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ formatHumanDateTime(row.created_at) }}</div>
          </div>
        </template>
      </DataTable>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as branchesApi from '@api/branches'
import AppAlert from '@components/ui/AppAlert.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useSaleReturnsStore } from '@stores/sales'
import { formatAccountingMoney } from '@/utils/accounting'
import { formatHumanDate, formatHumanDateTime } from '@/utils/date'

const { t } = useI18n()
const auth = useAuthStore()
const store = useSaleReturnsStore()

const filtersExpanded = ref(false)
const branches = ref([])
const alert = reactive({ show: false, type: 'success', title: '', message: '' })

const columns = [
  { key: 'return', label: 'Return' },
  { key: 'sale', label: 'Sale' },
  { key: 'refund', label: 'Refund' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
]

const branchOptions = computed(() =>
  branches.value.map((branch) => ({
    value: branch.id,
    label: branch.name,
    description: branch.code || '',
  }))
)

const activeFilterCount = computed(() =>
  [store.filters.branch_id].filter(Boolean).length
)

const refundMethodLabel = (method) => {
  if (!method) {
    return t('sales.shared.notRecorded')
  }

  const key = `sales.shared.methods.${method}`
  const translated = t(key)
  return translated === key ? method : translated
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

const resetFilters = () => {
  store.fetchItems({ branch_id: '', page: 1 })
}

onMounted(async () => {
  await Promise.all([
    store.fetchItems(),
    loadBranches(),
  ])
})
</script>
