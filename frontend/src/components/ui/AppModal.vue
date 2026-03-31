<template>
  <Teleport to="body">
    <Transition name="erp-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-3 py-4"
        :class="overlayClass"
        @click.self="handleBackdrop"
      >
        <div
          class="flex w-full flex-col overflow-hidden rounded-[5px] border border-slate-800/80 bg-white/90 shadow-[0_30px_90px_rgba(0,0,0,0.28)] dark:border-slate-700/70 dark:bg-slate-900/95"
          :class="[sizeClass, containerClass]"
        >
          <div class="flex items-start justify-between gap-4 border-b border-slate-200/70 px-4 py-4 dark:border-slate-800/80">
            <div>
              <div v-if="icon" class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                {{ icon }}
              </div>
              <h2 class="text-xl font-semibold text-slate-950 dark:text-white">{{ title }}</h2>
            </div>

            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-[5px] border border-slate-200/80 bg-white/70 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
              aria-label="Close modal"
              @click="$emit('close')"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="max-h-[70vh] overflow-y-auto px-4 py-4" :class="bodyClass">
            <slot />
          </div>

          <div v-if="$slots.footer" class="border-t border-slate-200/70 px-4 py-4 dark:border-slate-800/80">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' },
  icon: { type: String, default: '' },
  closeOnBackdrop: { type: Boolean, default: true },
  mobileFullScreen: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const sizeClass = computed(() => ({
  'max-w-md': props.size === 'sm',
  'max-w-2xl': props.size === 'md',
  'max-w-4xl': props.size === 'lg',
  'max-w-5xl': props.size === 'xl',
}))

const overlayClass = computed(() => props.mobileFullScreen
  ? 'items-stretch justify-stretch px-0 py-0 sm:items-center sm:justify-center sm:px-3 sm:py-4'
  : '')

const containerClass = computed(() => props.mobileFullScreen
  ? 'h-[100dvh] max-h-[100dvh] max-w-none rounded-none border-0 shadow-none sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[5px] sm:border sm:shadow-[0_30px_90px_rgba(0,0,0,0.28)]'
  : 'max-h-[calc(100dvh-2rem)]')

const bodyClass = computed(() => props.mobileFullScreen
  ? 'max-h-none min-h-0 flex-1 overscroll-contain pb-24 sm:max-h-[70vh] sm:flex-none sm:pb-4'
  : '')

const handleBackdrop = () => {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}

watch(
  () => props.show,
  (value) => {
    document.body.style.overflow = value ? 'hidden' : ''
  },
  { immediate: true }
)
</script>

<style scoped>
.erp-fade-enter-active,
.erp-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.erp-fade-enter-from,
.erp-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
