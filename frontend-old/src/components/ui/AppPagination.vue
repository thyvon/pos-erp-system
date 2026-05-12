<template>
  <nav v-if="lastPage > 1" aria-label="Pagination" class="flex items-center gap-2">
    <button
      type="button"
      class="erp-button-secondary px-3 py-2 text-xs"
      :disabled="currentPage <= 1"
      @click="$emit('change', currentPage - 1)"
    >
      Previous
    </button>

    <template v-for="item in pages" :key="item.key">
      <span
        v-if="item.page === null"
        class="inline-flex h-10 min-w-10 items-center justify-center rounded-[5px] text-sm text-slate-400 dark:text-slate-500"
      >
        ...
      </span>
      <button
        v-else
        type="button"
        class="inline-flex h-10 min-w-10 items-center justify-center rounded-[5px] px-3 text-sm font-medium transition"
        :class="
          item.page === currentPage
            ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950'
            : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white'
        "
        @click="$emit('change', item.page)"
      >
        {{ item.page }}
      </button>
    </template>

    <button
      type="button"
      class="erp-button-secondary px-3 py-2 text-xs"
      :disabled="currentPage >= lastPage"
      @click="$emit('change', currentPage + 1)"
    >
      Next
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  lastPage: { type: Number, default: 1 },
})

defineEmits(['change'])

const pages = computed(() => {
  if (props.lastPage <= 1) {
    return []
  }

  const visible = new Set([1, props.lastPage, props.currentPage - 1, props.currentPage, props.currentPage + 1])
  const sorted = [...visible]
    .filter((page) => page >= 1 && page <= props.lastPage)
    .sort((left, right) => left - right)

  return sorted.reduce((items, page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push({ key: `gap-${sorted[index - 1]}-${page}`, page: null })
    }

    items.push({ key: `page-${page}`, page })
    return items
  }, [])
})
</script>
