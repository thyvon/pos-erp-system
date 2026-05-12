<template>
  <span
    class="erp-badge px-3 py-1.5 capitalize tracking-wide"
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
  /** When set, shown instead of the raw status string (e.g. translated label). */
  label: { type: String, default: '' },
})

const normalizedStatus = computed(() => String(props.status || '').trim().toLowerCase())
const label = computed(() => props.label || normalizedStatus.value || 'unknown')

const badgeClass = computed(() => {
  if (['active', 'completed', 'paid', 'success'].includes(normalizedStatus.value)) {
    return 'erp-badge-success'
  }

  if (['draft', 'pending', 'warning'].includes(normalizedStatus.value)) {
    return 'erp-badge-warning'
  }

  if (['cancelled', 'canceled', 'expired', 'failed', 'danger', 'inactive', 'suspended'].includes(normalizedStatus.value)) {
    return 'erp-badge-danger'
  }

  return 'erp-badge-neutral'
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
