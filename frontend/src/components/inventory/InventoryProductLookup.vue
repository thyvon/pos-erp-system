<template>
  <div ref="root" class="relative">
    <div class="relative">
      <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
        <i class="fa-solid fa-barcode"></i>
      </span>

      <input
        v-model="query"
        type="text"
        class="erp-input pl-11 pr-11"
        :placeholder="resolvedPlaceholder"
        :disabled="disabled"
        @focus="openIfPossible"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="closeDropdown"
      />

      <button
        v-if="query"
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
        @click="clearQuery"
      >
        <span class="text-lg leading-none">×</span>
      </button>
    </div>

    <div v-if="helperText" class="mt-2 text-xs text-slate-500 dark:text-slate-400">
      {{ helperText }}
    </div>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <div
        v-if="showDropdown"
        class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[120] overflow-hidden rounded-[15px] border border-slate-200/80 bg-white/95 shadow-[0_22px_50px_rgba(44,62,99,0.16)] dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-[0_22px_50px_rgba(0,0,0,0.36)]"
      >
        <div v-if="loading" class="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
          Searching inventory...
        </div>

        <div v-else-if="results.length === 0" class="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
          {{ emptyText }}
        </div>

        <div v-else class="max-h-80 overflow-y-auto py-2">
          <button
            v-for="(result, index) in results"
            :key="result.lookup_key"
            type="button"
            class="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition"
            :class="index === highlightedIndex ? 'bg-cyan-50/80 dark:bg-cyan-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'"
            @mouseenter="highlightedIndex = index"
            @click="selectResult(result)"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {{ result.label }}
                </div>
                <span
                  v-if="primaryBalanceValue(result) !== null && primaryBalanceValue(result) !== undefined"
                  class="shrink-0 rounded-[6px] bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300"
                >
                  {{ primaryBalanceLabel(result) }}: {{ primaryBalanceValue(result) }}
                </span>
              </div>
              <div class="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span v-if="result.sku" class="erp-badge erp-badge-neutral px-2 text-[11px]">SKU: {{ result.sku }}</span>
                <span v-if="result.lot_number" class="erp-badge erp-badge-warning px-2 text-[11px]">Lot: {{ result.lot_number }}</span>
                <span v-if="result.serial_number" class="erp-badge erp-badge-info px-2 text-[11px]">Serial: {{ result.serial_number }}</span>
                <span
                  v-if="props.balanceMode === 'available' && result.on_hand_quantity !== null && result.on_hand_quantity !== undefined"
                  class="erp-badge erp-badge-success px-2 text-[11px]"
                >
                  On hand: {{ result.on_hand_quantity }}
                </span>
                <span
                  v-if="props.balanceMode === 'available' && result.reserved_quantity !== null && result.reserved_quantity !== undefined"
                  class="erp-badge erp-badge-danger px-2 text-[11px]"
                >
                  Reserved: {{ result.reserved_quantity }}
                </span>
                <span class="erp-badge erp-badge-info px-2 text-[11px]">
                  {{ readableMatchType(result.match_type) }}
                </span>
              </div>
            </div>
            <i v-if="result.is_exact_match" class="fa-solid fa-bolt mt-1 text-xs text-cyan-500"></i>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { searchInventoryProductLookup } from '@api/inventory'

const props = defineProps({
  warehouseId: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  emptyText: { type: String, default: 'No matching inventory items found.' },
  helperText: { type: String, default: '' },
  balanceMode: {
    type: String,
    default: 'available',
    validator: (value) => ['available', 'system'].includes(value),
  },
})

const emit = defineEmits(['select'])

const root = ref(null)
const query = ref('')
const results = ref([])
const loading = ref(false)
const open = ref(false)
const highlightedIndex = ref(0)
let debounceId = null

const resolvedPlaceholder = computed(
  () => props.placeholder || 'Scan or search by SKU, serial, lot, name, or description'
)

const showDropdown = computed(() => open.value && (loading.value || results.value.length > 0 || query.value.trim().length > 0))

const primaryBalanceLabel = (result) => {
  if (props.balanceMode === 'system') {
    return 'End'
  }

  if (result.available_quantity !== null && result.available_quantity !== undefined) {
    return 'Avail'
  }

  return 'End'
}

const primaryBalanceValue = (result) => {
  if (props.balanceMode === 'system') {
    return result.ending_quantity
  }

  if (result.available_quantity !== null && result.available_quantity !== undefined) {
    return result.available_quantity
  }

  return result.ending_quantity
}

const readableMatchType = (value) => {
  const labels = {
    serial: 'Serial match',
    lot: 'Lot match',
    product_sku: 'Product SKU',
    variation_sku: 'Variant SKU',
    product_name: 'Product name',
    variation_name: 'Variant name',
    product_description: 'Description',
  }

  return labels[value] || 'Match'
}

const closeDropdown = () => {
  open.value = false
  results.value = []
  highlightedIndex.value = 0
}

const clearQuery = () => {
  query.value = ''
  closeDropdown()
}

const openIfPossible = () => {
  if (props.disabled) {
    return
  }

  open.value = true
}

const moveHighlight = (direction) => {
  if (!showDropdown.value || results.value.length === 0) {
    return
  }

  const total = results.value.length
  highlightedIndex.value = (highlightedIndex.value + direction + total) % total
}

const selectResult = (result) => {
  emit('select', result)
  clearQuery()
}

const selectHighlighted = () => {
  if (!showDropdown.value || results.value.length === 0) {
    return
  }

  selectResult(results.value[highlightedIndex.value] || results.value[0])
}

const handleOutsideClick = (event) => {
  if (!root.value || root.value.contains(event.target)) {
    return
  }

  closeDropdown()
}

const runSearch = async (value) => {
  const term = value.trim()

  if (!term) {
    results.value = []
    loading.value = false
    return
  }

  loading.value = true
  open.value = true

  try {
    const response = await searchInventoryProductLookup({
      q: term,
      warehouse_id: props.warehouseId || undefined,
    })

    const matches = response.data.data || []
    results.value = matches
    highlightedIndex.value = 0

    if (
      matches.length === 1 &&
      matches[0].is_exact_match &&
      ['serial', 'lot', 'product_sku', 'variation_sku'].includes(matches[0].match_type)
    ) {
      selectResult(matches[0])
    }
  } finally {
    loading.value = false
  }
}

watch(query, (value) => {
  if (debounceId) {
    clearTimeout(debounceId)
  }

  if (!value.trim()) {
    results.value = []
    return
  }

  debounceId = setTimeout(() => {
    runSearch(value)
  }, 180)
})

watch(
  () => props.warehouseId,
  () => {
    if (query.value.trim()) {
      runSearch(query.value)
      return
    }

    results.value = []
  }
)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  if (debounceId) {
    clearTimeout(debounceId)
  }

  document.removeEventListener('click', handleOutsideClick)
})
</script>
