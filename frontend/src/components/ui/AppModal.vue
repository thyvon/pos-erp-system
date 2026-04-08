<template>
  <Teleport to="body">
    <Transition name="erp-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/44 px-3 py-4 backdrop-blur-2xl dark:bg-slate-950/62"
        :class="overlayClass"
        @click.self="handleBackdrop"
      >
        <div
          class="relative flex w-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/78 text-slate-900 shadow-[0_34px_90px_rgba(15,23,42,0.22)] backdrop-blur-[30px] dark:border-slate-700/70 dark:bg-slate-950/54 dark:text-slate-100 dark:shadow-[0_34px_90px_rgba(0,0,0,0.44)]"
          :class="[sizeClass, containerClass]"
        >
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/92 via-white/72 to-white/54 dark:from-slate-800/88 dark:via-slate-900/76 dark:to-slate-950/68"></div>
          <div class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_72%)] opacity-85 dark:bg-[radial-gradient(circle_at_top,rgba(148,197,255,0.2),transparent_72%)] dark:opacity-90"></div>
          <div class="pointer-events-none absolute inset-px rounded-[27px] border border-white/70 dark:border-white/5"></div>

          <div class="relative z-10 flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
            <div>
              <div v-if="icon" class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                {{ icon }}
              </div>
              <h2 class="text-xl font-semibold text-slate-950 dark:text-white">{{ title }}</h2>
            </div>

            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-slate-200/80 bg-white/78 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-md transition hover:border-sky-300 hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-sky-300/30 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close modal"
              @click="$emit('close')"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="relative z-10 max-h-[70vh] overflow-y-auto px-5 py-5 text-slate-800 dark:text-slate-100" :class="bodyClass">
            <slot />
          </div>

          <div v-if="$slots.footer" class="relative z-10 border-t border-slate-200/80 px-5 py-4 dark:border-white/10">
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
  ? 'h-[100dvh] max-h-[100dvh] max-w-none rounded-none border-0 shadow-none sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:border sm:shadow-[0_34px_90px_rgba(15,23,42,0.2)] sm:dark:shadow-[0_34px_90px_rgba(0,0,0,0.44)]'
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
