<template>
  <div ref="root" class="relative" :class="open ? 'z-[160]' : 'z-0'">
    <button
      type="button"
      class="erp-input flex items-center justify-between gap-3 text-left"
      :class="[
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        open ? 'border-cyan-400/70 shadow-[0_0_0_4px_rgba(58,123,255,0.10),inset_0_1px_0_rgba(255,255,255,0.72)]' : '',
      ]"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <div class="min-w-0 flex-1">
        <template v-if="multiple">
          <div v-if="selectedItems.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="item in previewItems"
              :key="String(item.value)"
              class="erp-badge erp-badge-info max-w-full px-2 text-[11px] font-medium"
            >
              <span class="truncate">{{ item.label }}</span>
            </span>
            <span
              v-if="selectedItems.length > previewItems.length"
              class="erp-badge erp-badge-neutral px-2 text-[11px] font-medium"
            >
              +{{ selectedItems.length - previewItems.length }}
            </span>
          </div>
          <span v-else class="block truncate text-sm text-slate-400 dark:text-slate-500">
            {{ placeholder }}
          </span>
        </template>
        <span
          v-else
          class="block truncate text-sm"
          :class="selectedItem ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'"
        >
          {{ selectedItem?.label || placeholder }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="clearable && hasSelection && !disabled"
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          @click.stop="clearSelection"
        >
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
        <i
          class="fa-solid fa-chevron-down text-xs text-slate-400 transition dark:text-slate-500"
          :class="open ? 'rotate-180' : ''"
        ></i>
      </div>
    </button>

    <Teleport to="body">
      <Transition name="erp-select-pop">
        <div
          v-if="open"
          ref="panel"
          class="fixed z-[170] overflow-hidden rounded-[24px] border border-white/50 bg-white/72 shadow-[0_24px_56px_rgba(44,62,99,0.16)] backdrop-blur-[26px] dark:border-white/10 dark:bg-slate-950/76 dark:shadow-[0_24px_56px_rgba(0,0,0,0.34)]"
          :style="panelStyle"
        >
          <div v-if="searchable" class="border-b border-white/40 p-3 dark:border-white/10">
            <SearchInput
              v-model="searchTerm"
              :placeholder="searchPlaceholder"
            />
          </div>

          <div class="max-h-72 overflow-y-auto py-2">
            <template v-if="filteredGroups.length">
              <div
                v-for="group in filteredGroups"
                :key="group.key"
                class="py-1"
              >
                <div
                  v-if="group.label"
                  class="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500"
                >
                  {{ group.label }}
                </div>

                <button
                  v-for="option in group.options"
                  :key="String(option.value)"
                type="button"
                class="mx-2 flex w-[calc(100%-1rem)] items-center justify-between gap-3 rounded-[18px] px-3 py-2.5 text-left text-sm transition hover:bg-sky-50/70 hover:text-cyan-700 dark:hover:bg-cyan-950/24 dark:hover:text-cyan-300"
                :class="isSelected(option.value) ? 'bg-sky-50/80 text-cyan-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] dark:border dark:border-cyan-400/28 dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.26),rgba(59,130,246,0.18))] dark:text-cyan-50 dark:shadow-[0_10px_20px_rgba(8,47,73,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-slate-700 dark:text-slate-200'"
                :disabled="option.disabled"
                @click="selectOption(option)"
              >
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-medium">{{ option.label }}</div>
                    <div v-if="option.description" class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {{ option.description }}
                    </div>
                  </div>
                  <i
                    v-if="isSelected(option.value)"
                    class="fa-solid fa-check text-xs"
                  ></i>
                </button>
              </div>
            </template>

            <div
              v-else
              class="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              {{ emptyText }}
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SearchInput from '@components/ui/SearchInput.vue'

const props = defineProps({
  modelValue: { type: [String, Number, Array, null], default: null },
  options: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Select option' },
  searchPlaceholder: { type: String, default: 'Search options' },
  emptyText: { type: String, default: 'No options found.' },
  maxPreviewItems: { type: Number, default: 2 },
})

const emit = defineEmits(['update:modelValue', 'change'])

const root = ref(null)
const panel = ref(null)
const open = ref(false)
const searchTerm = ref('')
const panelStyle = ref({})

const normalizedOptions = computed(() =>
  (props.options || []).map((option) => ({
    value: option.value,
    label: option.label ?? String(option.value ?? ''),
    group: option.group ?? null,
    description: option.description ?? '',
    disabled: Boolean(option.disabled),
    keywords: option.keywords ?? '',
  }))
)

const selectedValues = computed(() => {
  if (!props.multiple) {
    return props.modelValue === null || props.modelValue === undefined || props.modelValue === ''
      ? []
      : [props.modelValue]
  }

  return Array.isArray(props.modelValue) ? props.modelValue : []
})

const selectedItems = computed(() =>
  normalizedOptions.value.filter((option) => selectedValues.value.includes(option.value))
)

const selectedItem = computed(() => selectedItems.value[0] ?? null)
const previewItems = computed(() => selectedItems.value.slice(0, props.maxPreviewItems))
const hasSelection = computed(() => selectedValues.value.length > 0)

const filteredOptions = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  if (!term) {
    return normalizedOptions.value
  }

  return normalizedOptions.value.filter((option) =>
    [option.label, option.group, option.description, option.keywords]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

const filteredGroups = computed(() => {
  const groups = new Map()

  filteredOptions.value.forEach((option) => {
    const key = option.group || '__ungrouped__'

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: option.group,
        options: [],
      })
    }

    groups.get(key).options.push(option)
  })

  return Array.from(groups.values())
})

const isSelected = (value) => selectedValues.value.includes(value)

const close = () => {
  open.value = false
  searchTerm.value = ''
}

const updatePanelPosition = () => {
  if (!root.value) {
    return
  }

  const rect = root.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const gutter = 12
  const preferredWidth = Math.max(rect.width, 220)
  const availableWidth = Math.max(180, viewportWidth - (gutter * 2))
  const width = Math.min(preferredWidth, availableWidth)
  const left = Math.min(Math.max(rect.left, gutter), viewportWidth - width - gutter)

  panelStyle.value = {
    top: `${rect.bottom + 10}px`,
    left: `${left}px`,
    width: `${width}px`,
  }
}

const openDropdown = async () => {
  if (props.disabled) {
    return
  }

  open.value = true
  await nextTick()
  updatePanelPosition()

  if (props.searchable) {
    panel.value?.querySelector('input')?.focus()
  }
}

const toggleOpen = () => {
  if (open.value) {
    close()
  } else {
    openDropdown()
  }
}

const emitValue = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const selectOption = (option) => {
  if (option.disabled) {
    return
  }

  if (props.multiple) {
    const nextValues = new Set(selectedValues.value)

    if (nextValues.has(option.value)) {
      nextValues.delete(option.value)
    } else {
      nextValues.add(option.value)
    }

    emitValue(Array.from(nextValues))
    return
  }

  emitValue(option.value)
  close()
}

const clearSelection = () => {
  emitValue(props.multiple ? [] : null)
  close()
}

const handleDocumentPointerDown = (event) => {
  if (!open.value) {
    return
  }

  const target = event.target

  if (root.value?.contains(target) || panel.value?.contains(target)) {
    return
  }

  if (root.value) {
    close()
  }
}

const handleEscape = (event) => {
  if (event.key === 'Escape' && open.value) {
    close()
  }
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      close()
    }
  }
)

watch(open, (isOpen) => {
  if (!isOpen) {
    panelStyle.value = {}
    return
  }

  nextTick(() => {
    updatePanelPosition()
  })
})

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
})
</script>

<style scoped>
.erp-select-pop-enter-active,
.erp-select-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.erp-select-pop-enter-from,
.erp-select-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
</style>
