<template>
  <Teleport to="body">
    <Transition name="erp-toast">
      <div
        v-if="visible"
        class="erp-toast-shell pointer-events-none fixed left-3 right-3 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[90] w-auto max-w-none sm:left-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-[26rem]"
      >
        <div
          class="pointer-events-auto relative overflow-hidden rounded-[24px] border ring-1 shadow-[0_26px_60px_rgba(15,23,42,0.16)]"
          :class="toastClass"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div class="erp-toast-frost absolute inset-0"></div>
          <div class="absolute inset-x-0 top-0 z-[1] h-1.5" :class="barClass"></div>
          <div class="relative z-[1] flex items-start gap-4 px-5 py-4">
            <div class="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]" :class="iconWrapClass">
              <i class="fa-solid text-base" :class="iconClass"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="text-[15px] font-semibold leading-5 tracking-[0.01em]" :class="titleClass">{{ title }}</div>
                  <div class="mt-1 text-xs font-medium" :class="metaClass">{{ timestamp }}</div>
                </div>
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-[14px] border text-lg leading-none transition"
                  :class="closeButtonClass"
                  :aria-label="t('alert.dismiss')"
                  @click="dismiss"
                >
                  <i class="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
              <p class="mt-2.5 text-sm leading-6" :class="messageClass">{{ message }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIntlLocale } from '@/i18n'

const props = defineProps({
  show: { type: Boolean, default: false },
  type: { type: String, default: 'info' },
  message: { type: String, default: '' },
  title: { type: String, default: '' },
  autoDismissMs: { type: Number, default: 4000 },
})

const emit = defineEmits(['update:show', 'dismiss'])
const { t, locale } = useI18n()

const visible = ref(props.show)
const timestamp = ref('')
let timeoutId = null

const toastClass = computed(() => ({
  'border-white/78 bg-white/94 text-slate-950 ring-emerald-200/65 shadow-[0_26px_60px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/14 dark:bg-slate-950/92 dark:text-emerald-100 dark:ring-emerald-900/36 dark:shadow-[0_26px_60px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.07)]':
    props.type === 'success',
  'border-white/78 bg-white/94 text-slate-950 ring-rose-200/65 shadow-[0_26px_60px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/14 dark:bg-slate-950/92 dark:text-rose-100 dark:ring-rose-900/36 dark:shadow-[0_26px_60px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.07)]':
    props.type === 'danger',
  'border-white/78 bg-white/94 text-slate-950 ring-amber-200/65 shadow-[0_26px_60px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/14 dark:bg-slate-950/92 dark:text-amber-100 dark:ring-amber-900/36 dark:shadow-[0_26px_60px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.07)]':
    props.type === 'warning',
  'border-white/78 bg-white/94 text-slate-950 ring-cyan-200/65 shadow-[0_26px_60px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/14 dark:bg-slate-950/92 dark:text-cyan-100 dark:ring-cyan-900/36 dark:shadow-[0_26px_60px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.07)]':
    props.type === 'info',
}))

const barClass = computed(() => ({
  'bg-gradient-to-r from-emerald-500 to-emerald-400': props.type === 'success',
  'bg-gradient-to-r from-rose-500 to-rose-400': props.type === 'danger',
  'bg-gradient-to-r from-amber-500 to-amber-400': props.type === 'warning',
  'bg-gradient-to-r from-cyan-500 to-cyan-400': props.type === 'info',
}))

const iconWrapClass = computed(() => ({
  'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/45 dark:text-emerald-300': props.type === 'success',
  'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/45 dark:text-rose-300': props.type === 'danger',
  'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/45 dark:text-amber-300': props.type === 'warning',
  'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/45 dark:text-cyan-300': props.type === 'info',
}))

const iconClass = computed(() => ({
  'fa-circle-check': props.type === 'success',
  'fa-circle-xmark': props.type === 'danger',
  'fa-triangle-exclamation': props.type === 'warning',
  'fa-circle-info': props.type === 'info',
}))

const metaClass = computed(() => ({
  'text-slate-500 dark:text-slate-400': props.type === 'success',
  'text-slate-500 dark:text-slate-400': props.type === 'danger',
  'text-slate-500 dark:text-slate-400': props.type === 'warning',
  'text-slate-500 dark:text-slate-400': props.type === 'info',
}))

const messageClass = computed(() => ({
  'text-slate-700 dark:text-slate-200': props.type === 'success',
  'text-slate-700 dark:text-slate-200': props.type === 'danger',
  'text-slate-700 dark:text-slate-200': props.type === 'warning',
  'text-slate-700 dark:text-slate-200': props.type === 'info',
}))

const titleClass = computed(() => ({
  'text-emerald-950 dark:text-emerald-100': props.type === 'success',
  'text-rose-950 dark:text-rose-100': props.type === 'danger',
  'text-amber-950 dark:text-amber-100': props.type === 'warning',
  'text-cyan-950 dark:text-cyan-100': props.type === 'info',
}))

const closeButtonClass = computed(() => ({
  'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100':
    props.type === 'success',
  'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100':
    props.type === 'danger',
  'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100':
    props.type === 'warning',
  'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100':
    props.type === 'info',
}))

const clearTimer = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

const dismiss = () => {
  visible.value = false
  emit('update:show', false)
  emit('dismiss')
  clearTimer()
}

const startTimer = () => {
  clearTimer()

  if (!visible.value || props.autoDismissMs <= 0) {
    return
  }

  timestamp.value = new Date().toLocaleTimeString(getIntlLocale(locale.value), { hour: '2-digit', minute: '2-digit' })

  timeoutId = setTimeout(() => {
    dismiss()
  }, props.autoDismissMs)
}

watch(
  () => props.show,
  (value) => {
    visible.value = value
    startTimer()
  },
  { immediate: true }
)

onBeforeUnmount(clearTimer)
</script>

<style scoped>
.erp-toast-frost {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.8)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.34), transparent 48%),
    linear-gradient(315deg, rgba(186, 230, 253, 0.18), transparent 70%);
  backdrop-filter: blur(44px) saturate(180%);
  -webkit-backdrop-filter: blur(44px) saturate(180%);
}

.dark .erp-toast-frost {
  background:
    linear-gradient(180deg, rgba(8, 12, 24, 0.86), rgba(8, 12, 24, 0.8)),
    linear-gradient(135deg, rgba(30, 41, 59, 0.34), transparent 52%),
    linear-gradient(315deg, rgba(14, 116, 144, 0.14), transparent 72%);
  backdrop-filter: blur(48px) saturate(165%);
  -webkit-backdrop-filter: blur(48px) saturate(165%);
}

.erp-toast-shell {
  transform-origin: top center;
  will-change: transform, opacity, filter;
}

@media (min-width: 640px) {
  .erp-toast-shell {
    transform-origin: top right;
  }
}

.erp-toast-enter-active,
.erp-toast-leave-active {
  transition:
    opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.erp-toast-enter-from,
.erp-toast-leave-to {
  opacity: 0;
  filter: blur(10px);
}

.erp-toast-enter-from {
  transform: translateY(-16px) scale(0.96);
}

.erp-toast-leave-to {
  transform: translateY(-10px) scale(0.98);
}

.erp-toast-enter-to,
.erp-toast-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  .erp-toast-enter-active,
  .erp-toast-leave-active {
    transition: opacity 0.15s ease;
  }

  .erp-toast-enter-from,
  .erp-toast-leave-to,
  .erp-toast-enter-to,
  .erp-toast-leave-from {
    transform: none;
    filter: none;
  }
}
</style>
