<template>
  <div v-if="visibleItems.length" ref="root" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white"
      :title="title"
      :aria-label="title"
      @click.stop="toggle"
    >
      <i class="fa-solid fa-ellipsis-vertical"></i>
    </button>

    <div
      v-if="isOpen"
      :class="['absolute right-0 top-[calc(100%+0.45rem)] z-20 overflow-hidden rounded-[18px] border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95', menuClass]"
      @click.stop
    >
      <button
        v-for="item in visibleItems"
        :key="item.key"
        type="button"
        :class="itemClasses(item)"
        :title="item.title || item.label"
        :aria-label="item.ariaLabel || item.label"
        :disabled="Boolean(item.disabled || item.loading)"
        @click="selectItem(item)"
      >
        <span
          v-if="item.loading"
          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current"
        ></span>
        <i v-else-if="item.icon" class="fa-solid w-4" :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  title: { type: String, default: 'More actions' },
  menuClass: { type: String, default: 'min-w-[12rem]' },
})

const emit = defineEmits(['select', 'open', 'close'])

const root = ref(null)
const isOpen = ref(false)

const visibleItems = computed(() => props.items.filter((item) => !item?.hidden))

const close = () => {
  if (!isOpen.value) {
    return
  }

  isOpen.value = false
  emit('close')
}

const toggle = () => {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    emit('open')
    return
  }

  emit('close')
}

const selectItem = (item) => {
  if (item.disabled || item.loading) {
    return
  }

  close()
  emit('select', item)
  item.onClick?.()
}

const handleDocumentClick = (event) => {
  if (!root.value?.contains(event.target)) {
    close()
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    close()
  }
}

const itemClasses = (item) => {
  const tone = item.tone || 'default'

  const base = 'flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60'
  const tones = {
    default: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white',
    info: 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-200',
    success: 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200',
    warning: 'text-slate-700 hover:bg-amber-50 hover:text-amber-700 dark:text-slate-200 dark:hover:bg-amber-950/40 dark:hover:text-amber-200',
    danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-200',
  }

  return [base, tones[tone] || tones.default]
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>
