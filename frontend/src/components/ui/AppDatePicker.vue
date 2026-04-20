<template>
  <div ref="root" class="relative w-full" :class="open ? 'z-[160]' : 'z-0'">
    <button
      :id="id"
      type="button"
      class="erp-input flex w-full items-center justify-between gap-3 text-left"
      :class="[
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        open ? 'border-cyan-400/70 shadow-[0_0_0_4px_rgba(58,123,255,0.10),inset_0_1px_0_rgba(255,255,255,0.72)]' : '',
      ]"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <div class="min-w-0 flex-1">
        <span
          class="block truncate text-sm"
          :class="selectedDate ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'"
        >
          {{ selectedDate ? selectedDateLabel : placeholder }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="clearable && modelValue && !disabled"
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          @click.stop="clearSelection"
        >
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-[10px] bg-cyan-50/80 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300">
          <i class="fa-regular fa-calendar text-xs"></i>
        </span>
      </div>
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="translate-y-1 scale-[0.98] opacity-0"
        enter-to-class="translate-y-0 scale-100 opacity-100"
        leave-active-class="transition duration-120 ease-in"
        leave-from-class="translate-y-0 scale-100 opacity-100"
        leave-to-class="translate-y-1 scale-[0.98] opacity-0"
      >
        <div
          v-if="open"
          ref="panel"
          class="fixed z-[170] w-[20.5rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[15px] border border-slate-200/80 bg-white/95 shadow-[0_22px_50px_rgba(44,62,99,0.16)] dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-[0_22px_50px_rgba(0,0,0,0.36)]"
          :style="panelStyle"
        >
          <div class="flex items-center justify-between border-b border-slate-200/70 px-3 py-3 dark:border-slate-800/70">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              @click="moveMonth(-1)"
            >
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <div class="text-sm font-semibold text-slate-900 dark:text-white">
              {{ monthYearLabel }}
            </div>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              @click="moveMonth(1)"
            >
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>

          <div class="grid grid-cols-7 gap-1 px-3 pt-3">
            <div
              v-for="weekday in weekdays"
              :key="weekday"
              class="py-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500"
            >
              {{ weekday }}
            </div>
          </div>

          <div class="grid grid-cols-7 gap-1 p-3 pt-2">
            <button
              v-for="day in calendarDays"
              :key="day.key"
              type="button"
              class="inline-flex aspect-square items-center justify-center rounded-[12px] text-sm font-medium transition"
              :class="dayClasses(day)"
              :disabled="day.disabled"
              @click="selectDay(day)"
            >
              {{ day.date.getDate() }}
            </button>
          </div>

          <div class="flex items-center justify-between border-t border-slate-200/70 px-3 py-3 dark:border-slate-800/70">
            <button
              type="button"
              class="text-sm font-medium text-cyan-600 transition hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-cyan-300 dark:hover:text-cyan-200"
              :disabled="todayDisabled"
              @click="selectToday"
            >
              Today
            </button>
            <button
              type="button"
              class="text-sm font-medium text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:text-slate-200"
              :disabled="!modelValue"
              @click="clearSelection"
            >
              Clear
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, default: '' },
  placeholder: { type: String, default: 'Select date' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  min: { type: String, default: '' },
  max: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const { locale } = useI18n()
const root = ref(null)
const panel = ref(null)
const open = ref(false)
const panelStyle = ref({})
const viewMonth = ref(0)
const viewYear = ref(0)

const parseDateString = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

const formatDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const selectedDate = computed(() => parseDateString(props.modelValue))
const minDate = computed(() => parseDateString(props.min))
const maxDate = computed(() => parseDateString(props.max))

const normalizeDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) {
    return ''
  }

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(selectedDate.value)
})

const monthYearLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(viewYear.value, viewMonth.value, 1))
)

const weekdays = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  const start = new Date(2024, 0, 7)

  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)))
})

const syncViewToSelected = () => {
  const base = selectedDate.value || new Date()
  viewMonth.value = base.getMonth()
  viewYear.value = base.getFullYear()
}

watch(selectedDate, syncViewToSelected, { immediate: true })

const isSameDate = (left, right) =>
  left &&
  right &&
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const isDateDisabled = (date) => {
  const normalized = normalizeDateOnly(date)

  if (minDate.value && normalized < normalizeDateOnly(minDate.value)) {
    return true
  }

  if (maxDate.value && normalized > normalizeDateOnly(maxDate.value)) {
    return true
  }

  return false
}

const calendarDays = computed(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1)
  const leadingDays = firstOfMonth.getDay()
  const calendarStart = new Date(viewYear.value, viewMonth.value, 1 - leadingDays)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index)

    return {
      key: formatDateString(date),
      date,
      currentMonth: date.getMonth() === viewMonth.value,
      selected: isSameDate(date, selectedDate.value),
      today: isSameDate(date, new Date()),
      disabled: isDateDisabled(date),
    }
  })
})

const todayDisabled = computed(() => isDateDisabled(new Date()))

const dayClasses = (day) => {
  if (day.disabled) {
    return 'cursor-not-allowed text-slate-300 dark:text-slate-700'
  }

  if (day.selected) {
    return 'bg-cyan-600 text-white shadow-[0_14px_24px_rgba(14,165,233,0.28)] hover:bg-cyan-600'
  }

  if (!day.currentMonth) {
    return 'text-slate-300 hover:bg-slate-100 dark:text-slate-700 dark:hover:bg-slate-800'
  }

  if (day.today) {
    return 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950/35 dark:text-cyan-300 dark:hover:bg-cyan-950/55'
  }

  return 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
}

const close = () => {
  open.value = false
}

const updatePanelPosition = () => {
  if (!root.value) {
    return
  }

  const rect = root.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const gutter = 12
  const preferredWidth = 328
  const availableWidth = Math.max(260, viewportWidth - (gutter * 2))
  const width = Math.min(preferredWidth, availableWidth)
  const left = Math.min(Math.max(rect.left, gutter), viewportWidth - width - gutter)

  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${left}px`,
    width: `${width}px`,
  }
}

const openCalendar = async () => {
  if (props.disabled) {
    return
  }

  open.value = true
  await nextTick()
  updatePanelPosition()
}

const toggleOpen = () => {
  if (open.value) {
    close()
  } else {
    openCalendar()
  }
}

const moveMonth = (offset) => {
  const next = new Date(viewYear.value, viewMonth.value + offset, 1)
  viewMonth.value = next.getMonth()
  viewYear.value = next.getFullYear()
}

const emitValue = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const selectDay = (day) => {
  if (day.disabled) {
    return
  }

  emitValue(formatDateString(day.date))
  close()
}

const selectToday = () => {
  if (todayDisabled.value) {
    return
  }

  emitValue(formatDateString(new Date()))
  close()
}

const clearSelection = () => {
  emitValue('')
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

  close()
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
