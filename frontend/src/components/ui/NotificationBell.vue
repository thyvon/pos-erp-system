<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="erp-topbar-button relative"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="menu"
      :title="title"
      @click="open = !open"
    >
      <i class="fa-solid fa-bell text-[1.05rem]" aria-hidden="true"></i>
      <span
        v-if="displayCount > 0"
        class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
      >
        {{ displayCount > 9 ? '9+' : displayCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="erp-topbar-user-menu erp-notification-menu fixed left-4 right-4 top-[calc(env(safe-area-inset-top,0px)+4.75rem)] z-[60] w-auto max-w-none py-2 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-[min(20rem,calc(100vw-2rem))] sm:max-w-md"
      role="menu"
    >
      <div class="border-b border-slate-200/70 px-3 py-2 dark:border-slate-800/80">
        <div class="text-sm font-semibold text-slate-900 dark:text-white">{{ heading }}</div>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ body }}</p>
      </div>
      <div class="max-h-[min(20rem,calc(100vh-8rem))] overflow-y-auto px-2 py-2 sm:max-h-64">
        <p class="px-2 py-3 text-center text-sm text-slate-500 dark:text-slate-400">{{ emptyHint }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const open = ref(false)
const rootRef = ref(null)

const displayCount = computed(() => 0)
const title = computed(() => t('notifications.title'))
const heading = computed(() => t('notifications.menuHeading'))
const body = computed(() => t('notifications.menuBody'))
const emptyHint = computed(() => t('notifications.empty'))

const onDocPointer = (event) => {
  if (!open.value || !rootRef.value) {
    return
  }
  if (rootRef.value.contains(event.target)) {
    return
  }
  open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer)
})
</script>
