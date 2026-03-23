<template>
  <span
    class="inline-flex items-center rounded-[5px] px-3 py-1 text-xs font-semibold capitalize tracking-wide"
    :class="badgeClass"
  >
    <span class="mr-2 h-2 w-2 rounded-full" :class="dotClass"></span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: '' },
})

const normalizedStatus = computed(() => String(props.status || '').trim().toLowerCase())
const label = computed(() => normalizedStatus.value || 'unknown')

const badgeClass = computed(() => {
  if (['active', 'completed', 'paid', 'success'].includes(normalizedStatus.value)) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  }

  if (['draft', 'pending', 'warning'].includes(normalizedStatus.value)) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
  }

  if (['cancelled', 'canceled', 'expired', 'failed', 'danger', 'inactive', 'suspended'].includes(normalizedStatus.value)) {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
  }

  return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
})

const dotClass = computed(() => {
  if (['active', 'completed', 'paid', 'success'].includes(normalizedStatus.value)) {
    return 'bg-emerald-500'
  }

  if (['draft', 'pending', 'warning'].includes(normalizedStatus.value)) {
    return 'bg-amber-500'
  }

  if (['cancelled', 'canceled', 'expired', 'failed', 'danger', 'inactive', 'suspended'].includes(normalizedStatus.value)) {
    return 'bg-rose-500'
  }

  return 'bg-slate-500'
})
</script>
