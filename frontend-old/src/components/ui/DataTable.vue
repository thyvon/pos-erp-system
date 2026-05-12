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

    <div class="erp-table-stage">
      <div class="overflow-x-auto" :class="{ 'erp-table-content--loading': showRefreshingState }">
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

          <tbody v-else-if="showSkeletonRows">
            <tr v-for="rowIndex in skeletonRowCount" :key="`skeleton-${rowIndex}`" class="erp-table-skeleton-row">
              <td v-for="column in columns" :key="`${rowIndex}-${column.key}`">
                <span class="erp-table-skeleton-cell" :style="getSkeletonCellStyle(rowIndex, column.key)"></span>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
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

      <div v-if="showRefreshingState" class="erp-table-refresh-chip" aria-live="polite">
        <span class="erp-table-refresh-chip__dot"></span>
        <span class="erp-table-refresh-chip__label">Refreshing</span>
      </div>

      <div v-if="showRefreshingState" class="erp-table-refresh-bar" aria-hidden="true"></div>
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
import { computed, ref, watch } from 'vue'
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
const skeletonWidths = ['92%', '78%', '64%', '56%', '84%', '70%']
const skeletonRowCount = computed(() => Math.max(4, Math.min(props.perPage || 6, 6)))
const showSkeletonRows = computed(() => props.loading && props.rows.length === 0)
const showRefreshingState = computed(() => props.loading && props.rows.length > 0)

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
const getSkeletonCellStyle = (rowIndex, columnKey) => {
  const seed = `${columnKey}-${rowIndex}`
  let total = 0

  for (let index = 0; index < seed.length; index += 1) {
    total += seed.charCodeAt(index)
  }

  return {
    width: skeletonWidths[total % skeletonWidths.length],
  }
}
</script>

<style scoped>
.erp-table-stage {
  position: relative;
  min-height: 12rem;
}

.erp-table-content--loading {
  opacity: 0.62;
  transition: opacity 0.18s ease;
}

.erp-table-skeleton-row td {
  padding-top: 0.95rem;
  padding-bottom: 0.95rem;
}

.erp-table-skeleton-cell {
  position: relative;
  display: block;
  min-width: 3.5rem;
  height: 0.78rem;
  overflow: hidden;
  border-radius: 9999px;
  background:
    linear-gradient(90deg, rgba(226, 232, 240, 0.92), rgba(241, 245, 249, 0.98));
}

.erp-table-skeleton-cell::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.78), transparent);
  animation: erp-table-loading-shimmer 1.2s ease-in-out infinite;
}

.erp-table-refresh-chip {
  position: absolute;
  top: 0.9rem;
  right: 1rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.72rem;
  border: 1px solid rgba(191, 219, 254, 0.9);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.14);
}

.erp-table-refresh-chip__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: #2563eb;
  box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.24);
  animation: erp-table-loading-pulse 1.2s ease-in-out infinite;
}

.erp-table-refresh-chip__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #334155;
}

.erp-table-refresh-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  height: 2px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.14);
}

.erp-table-refresh-bar::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 28%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  animation: erp-table-refresh-slide 1.15s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.dark .erp-table-skeleton-cell {
  background: linear-gradient(90deg, rgba(51, 65, 85, 0.94), rgba(71, 85, 105, 0.88));
}

.dark .erp-table-refresh-chip {
  border-color: rgba(59, 130, 246, 0.28);
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.24);
}

.dark .erp-table-refresh-chip__dot {
  background: #38bdf8;
  box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.2);
}

.dark .erp-table-refresh-chip__label {
  color: #cbd5e1;
}

.dark .erp-table-refresh-bar {
  background: rgba(51, 65, 85, 0.45);
}

@keyframes erp-table-loading-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes erp-table-loading-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.2);
  }

  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 7px rgba(37, 99, 235, 0);
  }
}

@keyframes erp-table-refresh-slide {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(360%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .erp-table-content--loading {
    transition: none;
  }

  .erp-table-refresh-chip__dot,
  .erp-table-skeleton-cell::after,
  .erp-table-refresh-bar::after {
    animation: none;
  }
}
</style>
