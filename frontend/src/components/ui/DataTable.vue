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

    <div class="erp-table-stage" :class="{ 'erp-table-stage--loading': loading }">
      <div class="overflow-x-auto" :class="{ 'erp-table-content--loading': loading && rows.length > 0 }">
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
                  <span v-if="column.sortable" class="inline-flex h-4 w-4 items-center justify-center text-[10px] text-slate-400 dark:text-slate-500">
                    <i class="fa-solid" :class="sortIconClass(column.key)"></i>
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

      <div v-if="loading" class="erp-table-loading-wash" aria-hidden="true"></div>
    </div>

    <div class="flex flex-col gap-3 border-t border-white/40 px-4 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
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

const sortIconClass = (key) => {
  if (props.sortKey !== key) {
    return 'fa-arrows-up-down'
  }

  return props.sortDirection === 'asc' ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short'
}

const sortIcon = (key) => {
  if (props.sortKey !== key) {
    return '↕'
  }

  return props.sortDirection === 'asc' ? '↑' : '↓'
}
</script>

<style scoped>
.erp-table-stage {
  position: relative;
  min-height: 12rem;
}

.erp-table-content--loading {
  filter: blur(10px);
  opacity: 0.68;
  transition:
    filter 0.18s ease,
    opacity 0.18s ease;
}

.erp-table-loading-wash {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 1.5rem;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08)),
    radial-gradient(circle at 20% 18%, rgba(96, 165, 250, 0.14), transparent 34%),
    radial-gradient(circle at 82% 78%, rgba(34, 211, 238, 0.12), transparent 30%);
  backdrop-filter: blur(16px) saturate(1.08);
  -webkit-backdrop-filter: blur(16px) saturate(1.08);
}

.dark .erp-table-loading-wash {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.26), rgba(15, 23, 42, 0.14)),
    radial-gradient(circle at 18% 16%, rgba(59, 130, 246, 0.14), transparent 36%),
    radial-gradient(circle at 82% 78%, rgba(14, 165, 233, 0.12), transparent 32%);
}

@media (prefers-reduced-motion: reduce) {
  .erp-table-content--loading {
    transition: none;
  }
}
</style>
