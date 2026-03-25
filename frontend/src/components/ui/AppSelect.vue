<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="erp-input flex min-h-[46px] items-center justify-between gap-3 text-left"
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
              class="inline-flex max-w-full items-center rounded-[10px] bg-cyan-100 px-2 py-1 text-[11px] font-medium text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300"
            >
              <span class="truncate">{{ item.label }}</span>
            </span>
            <span
              v-if="selectedItems.length > previewItems.length"
              class="inline-flex rounded-[10px] bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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

    <Transition name="erp-select-pop">
      <div
        v-if="open"
        class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[90] overflow-hidden rounded-[15px] border border-slate-200/80 bg-white/95 shadow-[0_22px_50px_rgba(44,62,99,0.16)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/95 dark:shadow-[0_22px_50px_rgba(2,6,23,0.38)]"
      >
        <div v-if="searchable" class="border-b border-slate-200/70 p-3 dark:border-slate-800/70">
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
                class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500"
              >
                {{ group.label }}
              </div>

              <button
                v-for="option in group.options"
                :key="String(option.value)"
                type="button"
                class="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-cyan-50/80 hover:text-cyan-700 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300"
                :class="isSelected(option.value) ? 'bg-cyan-50/70 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-200'"
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
const open = ref(false)
const searchTerm = ref('')

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

const openDropdown = async () => {
  if (props.disabled) {
    return
  }

  open.value = true

  if (props.searchable) {
    await nextTick()
    root.value?.querySelector('input')?.focus()
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

  if (root.value && !root.value.contains(event.target)) {
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

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleEscape)
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
