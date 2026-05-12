<template>
  <AppLayout
    title="Journals"
    subtitle="Review posted journals, reverse incorrect entries, and add manual adjustments."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Accounting' },
      { label: 'Journals' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-book text-cyan-600 dark:text-cyan-400"></i>
            Total Journals
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.total_journals }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Append-only journal history for this business.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-circle-check text-cyan-600 dark:text-cyan-400"></i>
            Posted
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.posted_journals }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Balanced journals already committed to the ledger.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-rotate-left text-cyan-600 dark:text-cyan-400"></i>
            Reversed
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.reversed_journals }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Original journals already neutralized by reversal entries.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-sack-dollar text-cyan-600 dark:text-cyan-400"></i>
            Posted Volume
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ formatAccountingMoney(store.summary.posted_volume) }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Current posted debit volume across active journals.</p>
        </article>
      </section>

      <FilterPanel
        v-model:expanded="filtersExpanded"
        title="Filters"
        description="Refine the journal list by status or posting source."
        :active-count="activeFilterCount"
        :show-clear="activeFilterCount > 0"
        @clear="resetFilters"
      >
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label class="erp-label">Status</label>
            <AppSelect
              :model-value="store.filters.status || null"
              :options="statusOptions"
              clearable
              placeholder="All statuses"
              @update:model-value="handleStatusFilter($event)"
            />
          </div>
          <div>
            <label class="erp-label">Journal type</label>
            <AppSelect
              :model-value="store.filters.journal_type || null"
              :options="journalTypeOptions"
              clearable
              placeholder="All journal types"
              @update:model-value="handleTypeFilter($event)"
            />
          </div>
        </div>
      </FilterPanel>

      <DataTable
        title="Journals"
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
          <button v-if="canManageJournals" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            Manual journal
          </button>
        </template>

        <template #journal="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.journal_number }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ formatHumanDateTime(row.date) }}</div>
          </div>
        </template>

        <template #source="{ row }">
          <div>
            <span class="erp-badge capitalize" :class="getAccountingTypeClass(row.journal_type)">
              {{ startCase(row.journal_type) }}
            </span>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ journalReferenceLabel(row) }}</div>
          </div>
        </template>

        <template #summary="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.description }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.entry_count }} journal line{{ row.entry_count === 1 ? '' : 's' }}</div>
          </div>
        </template>

        <template #total="{ row }">
          <div class="text-sm font-semibold text-slate-900 dark:text-white">{{ formatAccountingMoney(row.total) }}</div>
        </template>

        <template #status="{ row }">
          <span class="erp-badge capitalize" :class="getAccountingStatusClass(row.status)">
            {{ startCase(row.status) }}
          </span>
        </template>

        <template #poster="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.poster?.name || 'System' }}</div>
            <div v-if="row.reversed_by?.journal_number" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Reversed by {{ row.reversed_by.journal_number }}
            </div>
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="canShowReverseAction(row)" class="flex items-center gap-2">
            <button type="button" class="erp-button-icon" @click="openReverseModal(row)">
              <i class="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="createModal.show"
        title="Post manual journal"
        icon="manual journal"
        size="xl"
        @close="closeCreateModal"
      >
        <form class="space-y-5" @submit.prevent="submitJournal">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">Posting date</label>
              <AppDatePicker v-model="journalForm.posted_at" />
            </div>
            <div>
              <label class="erp-label">Fiscal year</label>
              <AppSelect
                v-model="journalForm.fiscal_year_id"
                :options="fiscalYearOptions"
                clearable
                placeholder="Optional fiscal year"
              />
            </div>
          </div>

          <div>
            <label class="erp-label" for="journal_description">Description</label>
            <textarea id="journal_description" v-model="journalForm.description" rows="3" class="erp-input min-h-[6rem]"></textarea>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Journal lines</h3>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Use postable accounts only. Debits and credits must balance exactly.</p>
              </div>
              <button type="button" class="erp-button-secondary" @click="addEntry">
                <i class="fa-solid fa-plus"></i>
                Add line
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(entry, index) in journalForm.entries"
                :key="entry.key"
                class="grid gap-3 rounded-[12px] border border-slate-200/80 p-3 dark:border-slate-800/80 md:grid-cols-[1.4fr_0.9fr_0.9fr_auto]"
              >
                <div>
                  <label class="erp-label">Account</label>
                  <AppSelect
                    v-model="entry.account_id"
                    :options="chartAccountOptions"
                    searchable
                    placeholder="Select account"
                    search-placeholder="Search accounts"
                    empty-text="No postable accounts found."
                  />
                </div>
                <div>
                  <label class="erp-label">Type</label>
                  <AppSelect
                    v-model="entry.type"
                    :options="entryTypeOptions"
                    placeholder="Select type"
                  />
                </div>
                <div>
                  <label class="erp-label">Amount</label>
                  <input v-model.number="entry.amount" type="number" min="0.01" step="0.01" class="erp-input" />
                </div>
                <div class="flex items-end">
                  <button
                    type="button"
                    class="erp-button-icon"
                    :disabled="journalForm.entries.length <= 2"
                    @click="removeEntry(index)"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>

                <div class="md:col-span-4">
                  <label class="erp-label">Line note</label>
                  <input v-model="entry.description" type="text" class="erp-input" placeholder="Optional line description" />
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-4 rounded-[12px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-slate-800/80 dark:bg-slate-900/40 md:grid-cols-3">
            <div>
              <div class="text-slate-500 dark:text-slate-400">Debit total</div>
              <div class="mt-1 font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(journalDebitTotal) }}</div>
            </div>
            <div>
              <div class="text-slate-500 dark:text-slate-400">Credit total</div>
              <div class="mt-1 font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(journalCreditTotal) }}</div>
            </div>
            <div>
              <div class="text-slate-500 dark:text-slate-400">Balance check</div>
              <div class="mt-1 font-semibold" :class="journalTotalsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                {{ journalTotalsMatch ? 'Balanced' : 'Not balanced' }}
              </div>
            </div>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeCreateModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              Post journal
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal
        :show="reverseModal.show"
        title="Reverse journal"
        icon="reversal"
        size="md"
        @close="closeReverseModal"
      >
        <form class="space-y-5" @submit.prevent="submitReverse">
          <div class="rounded-[12px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-700 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-200">
            <div class="font-semibold text-slate-950 dark:text-white">{{ reverseModal.journal?.journal_number }}</div>
            <div class="mt-1">{{ reverseModal.journal?.description }}</div>
          </div>

          <div>
            <label class="erp-label" for="reverse_reason">Reason</label>
            <textarea id="reverse_reason" v-model="reverseModal.reason" rows="4" class="erp-input min-h-[7rem]" placeholder="Required reason for reversal"></textarea>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeReverseModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              Reverse journal
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import * as accountingApi from '@api/accounting'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useJournalsStore } from '@stores/accounting'
import { useAuthStore } from '@stores/auth'
import { formatAccountingMoney, getAccountingStatusClass, getAccountingTypeClass, startCase } from '@/utils/accounting'
import { formatHumanDateTime } from '@/utils/date'

const auth = useAuthStore()
const store = useJournalsStore()
const filtersExpanded = ref(false)
const chartAccounts = ref([])
const fiscalYears = ref([])
let nextEntryKey = 0

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const createModal = reactive({ show: false })
const reverseModal = reactive({ show: false, journal: null, reason: '' })
const journalForm = reactive({
  fiscal_year_id: '',
  posted_at: new Date().toISOString().slice(0, 10),
  description: '',
  entries: [],
})

const canManageJournals = computed(() => auth.canAny(['accounting.index', 'accounting.journals']))
const canReverseByRole = () => auth.hasRole(['admin', 'accountant'])

const columns = computed(() => {
  const base = [
    { key: 'journal', label: 'Journal' },
    { key: 'source', label: 'Source' },
    { key: 'summary', label: 'Summary' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'poster', label: 'Posted By' },
  ]

  if (canManageJournals.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const statusOptions = [
  { value: 'posted', label: 'Posted' },
  { value: 'reversed', label: 'Reversed' },
]

const journalTypeOptions = [
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'payment_in', label: 'Payment In' },
  { value: 'payment_out', label: 'Payment Out' },
  { value: 'sale_return', label: 'Sale Return' },
  { value: 'purchase_return', label: 'Purchase Return' },
  { value: 'expense', label: 'Expense' },
  { value: 'manual', label: 'Manual' },
  { value: 'reversal', label: 'Reversal' },
  { value: 'opening', label: 'Opening' },
  { value: 'manufacturing', label: 'Manufacturing' },
]

const entryTypeOptions = [
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit' },
]

const chartAccountOptions = computed(() =>
  chartAccounts.value
    .filter((account) => account.status === 'active' && account.is_postable)
    .map((account) => ({
      value: account.id,
      label: `${account.code} - ${account.name}`,
    }))
)

const fiscalYearOptions = computed(() =>
  fiscalYears.value
    .filter((year) => year.status === 'active')
    .map((year) => ({
      value: year.id,
      label: `${year.name} (${year.start_date} to ${year.end_date})`,
    }))
)

const activeFilterCount = computed(() =>
  [store.filters.status, store.filters.journal_type].filter((value) => value !== '' && value !== null).length
)

const journalDebitTotal = computed(() =>
  journalForm.entries
    .filter((entry) => entry.type === 'debit')
    .reduce((total, entry) => total + Number(entry.amount || 0), 0)
)

const journalCreditTotal = computed(() =>
  journalForm.entries
    .filter((entry) => entry.type === 'credit')
    .reduce((total, entry) => total + Number(entry.amount || 0), 0)
)

const journalTotalsMatch = computed(() => {
  const debit = Number(journalDebitTotal.value.toFixed(2))
  const credit = Number(journalCreditTotal.value.toFixed(2))
  return debit > 0 && debit === credit
})

const createEntry = () => ({
  key: `entry-${nextEntryKey += 1}`,
  account_id: '',
  type: 'debit',
  amount: '',
  description: '',
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const shortReferenceType = (value) => {
  const raw = String(value || '').trim()
  if (!raw) {
    return ''
  }

  const segments = raw.split('\\')
  return segments[segments.length - 1]
}

const journalReferenceLabel = (row) => {
  if (!row.reference_type && !row.reference_id) {
    return 'Manual posting'
  }

  const type = shortReferenceType(row.reference_type)
  if (type && row.reference_id) {
    return `${type} - ${String(row.reference_id).slice(0, 8)}`
  }

  return type || String(row.reference_id || '')
}

const canShowReverseAction = (row) => (
  canManageJournals.value &&
  canReverseByRole() &&
  row.status === 'posted' &&
  row.journal_type !== 'reversal'
)

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })
const handleStatusFilter = (value) => store.fetchItems({ status: value || '', page: 1 })
const handleTypeFilter = (value) => store.fetchItems({ journal_type: value || '', page: 1 })

const resetFilters = () => {
  store.fetchItems({
    status: '',
    journal_type: '',
    page: 1,
  })
}

const loadLookups = async () => {
  const [accountResponse, fiscalYearResponse] = await Promise.allSettled([
    accountingApi.getChartOfAccounts({ per_page: 250, status: 'active' }),
    accountingApi.getFiscalYears({ per_page: 100 }),
  ])

  chartAccounts.value = accountResponse.status === 'fulfilled' ? accountResponse.value.data.data : []
  fiscalYears.value = fiscalYearResponse.status === 'fulfilled' ? fiscalYearResponse.value.data.data : []
}

const warmLookups = () => {
  loadLookups()
}

const resetJournalForm = () => {
  journalForm.fiscal_year_id = ''
  journalForm.posted_at = new Date().toISOString().slice(0, 10)
  journalForm.description = ''
  journalForm.entries = [
    createEntry(),
    { ...createEntry(), type: 'credit' },
  ]
}

const openCreateModal = () => {
  if (!canManageJournals.value) return
  resetJournalForm()
  createModal.show = true
  warmLookups()
}

const closeCreateModal = () => {
  createModal.show = false
}

const addEntry = () => {
  journalForm.entries.push(createEntry())
}

const removeEntry = (index) => {
  if (journalForm.entries.length <= 2) {
    return
  }

  journalForm.entries.splice(index, 1)
}

const submitJournal = async () => {
  try {
    if (!journalForm.description.trim()) {
      throw new Error('Journal description is required.')
    }

    if (journalForm.entries.length < 2) {
      throw new Error('At least two journal lines are required.')
    }

    if (!journalTotalsMatch.value) {
      throw new Error('Debit and credit totals must be balanced before posting.')
    }

    const entries = journalForm.entries.map((entry) => ({
      account_id: entry.account_id,
      type: entry.type,
      amount: Number(entry.amount || 0),
      description: entry.description?.trim() || null,
    }))

    if (entries.some((entry) => !entry.account_id || !entry.type || entry.amount <= 0)) {
      throw new Error('Every journal line must have an account, type, and positive amount.')
    }

    await store.createItem({
      fiscal_year_id: journalForm.fiscal_year_id || null,
      posted_at: journalForm.posted_at || null,
      description: journalForm.description.trim(),
      entries,
    })

    showToast('success', 'Manual journal posted successfully.')
    closeCreateModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || error.message || 'Unable to post the journal.')
  }
}

const openReverseModal = (journal) => {
  reverseModal.show = true
  reverseModal.journal = journal
  reverseModal.reason = ''
}

const closeReverseModal = () => {
  reverseModal.show = false
  reverseModal.journal = null
  reverseModal.reason = ''
}

const submitReverse = async () => {
  try {
    if (!reverseModal.journal) {
      throw new Error('No journal selected for reversal.')
    }

    if (!String(reverseModal.reason || '').trim()) {
      throw new Error('A reversal reason is required.')
    }

    await store.reverseItem(reverseModal.journal.id, {
      reason: reverseModal.reason.trim(),
    })

    showToast('success', 'Journal reversed successfully.')
    closeReverseModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || error.message || 'Unable to reverse the journal.')
  }
}

onMounted(() => {
  store.fetchItems()
  warmLookups()
})
</script>


