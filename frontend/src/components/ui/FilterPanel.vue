<template>
  <section class="relative z-10 overflow-visible rounded-[5px] border border-slate-200/80 bg-white/80 shadow-[0_10px_24px_rgba(56,77,112,0.06)] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/75">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
      @click="$emit('update:expanded', !expanded)"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2.5">
          <span class="text-sm font-semibold text-slate-950 dark:text-white">{{ title }}</span>
          <span
            class="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {{ activeCount }} active
          </span>
        </div>
        <div class="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {{ description }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="showClear"
          type="button"
          class="erp-button-secondary px-3 py-2 text-xs"
          @click.stop="$emit('clear')"
        >
          Clear
        </button>
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300"
        >
          <i class="fa-solid fa-chevron-down transition" :class="expanded ? 'rotate-180' : ''"></i>
        </span>
      </div>
    </button>

    <div v-if="expanded" class="border-t border-slate-200/70 px-3 py-3 dark:border-slate-800/80">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Filters' },
  description: { type: String, default: '' },
  activeCount: { type: Number, default: 0 },
  expanded: { type: Boolean, default: false },
  showClear: { type: Boolean, default: false },
})

defineEmits(['update:expanded', 'clear'])
</script>
