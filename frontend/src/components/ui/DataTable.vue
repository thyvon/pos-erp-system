<template>
  <div class="erp-table-shell">
    <div class="erp-table-header">
      <div>
        <h2 class="text-lg font-semibold text-slate-950 dark:text-white">{{ title }}</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ t('table.total', { count: total }) }}
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="w-full sm:w-72">
          <SearchInput v-model="searchValue" :placeholder="searchPlaceholder" />
        </div>
        <slot name="toolbar" />
      </div>
    </div>

    <div class="relative">
      <LoadingSpinner :show="loading" :title="t('table.loadingTitle')" :message="t('table.loadingMessage')" />

      <div class="overflow-x-auto">
        <table class="erp-table">
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                class="select-none"
                :class="column.sortable ? 'cursor-pointer' : ''"
                @click="handleSort(column)"
              >
                <div class="flex items-center gap-2">
                  <span>{{ column.label }}</span>
                  <span v-if="column.sortable" class="text-[10px]">
                    {{ sortIcon(column.key) }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody v-if="rows.length > 0">
            <tr v-for="row in rows" :key="row.id ?? JSON.stringify(row)">
              <td v-for="column in columns" :key="column.key">
                <slot :name="column.key" :row="row">
                  {{ row[column.key] }}
                </slot>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="!loading">
            <tr>
              <td :colspan="columns.length" class="px-4 py-12 text-center">
                <div class="mx-auto max-w-sm">
                  <div class="text-base font-semibold text-slate-950 dark:text-white">{{ t('table.noRecordsFound') }}</div>
                  <div class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {{ t('table.noRecordsMessage') }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex flex-col gap-3 border-t border-slate-200/70 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-2.5 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center">
        <span>{{ t('table.pageOf', { current: currentPage, last: lastPage }) }}</span>
        <label class="flex items-center gap-2">
          <span>{{ t('table.rows') }}</span>
          <select
            class="erp-select max-w-[5.5rem] py-2"
            :value="perPage"
            @change="$emit('per-page-change', Number($event.target.value))"
          >
            <option v-for="option in perPageOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </label>
      </div>

      <AppPagination
        :current-page="currentPage"
        :last-page="lastPage"
        @change="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPagination from './AppPagination.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import SearchInput from './SearchInput.vue'

const props = defineProps({
  title: { type: String, default: '' },
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  lastPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 15 },
  searchTerm: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
  sortKey: { type: String, default: '' },
  sortDirection: { type: String, default: 'asc' },
  perPageOptions: { type: Array, default: () => [10, 15, 25, 50] },
})

const emit = defineEmits(['search', 'sort-change', 'page-change', 'per-page-change'])
const { t } = useI18n()

const searchValue = ref(props.searchTerm)
let searchTimer = null

watch(
  () => props.searchTerm,
  (value) => {
    searchValue.value = value
  }
)

watch(searchValue, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    emit('search', value)
  }, 350)
})

const handleSort = (column) => {
  if (!column.sortable) {
    return
  }

  const direction =
    props.sortKey === column.key && props.sortDirection === 'asc'
      ? 'desc'
      : 'asc'

  emit('sort-change', {
    key: column.key,
    direction,
  })
}

const sortIcon = (key) => {
  if (props.sortKey !== key) {
    return '↕'
  }

  return props.sortDirection === 'asc' ? '↑' : '↓'
}
</script>
