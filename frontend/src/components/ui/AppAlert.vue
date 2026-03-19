<template>
  <Teleport to="body">
    <Transition name="erp-toast">
      <div v-if="visible" class="fixed right-4 top-4 z-[90] w-full max-w-sm">
        <div
          class="overflow-hidden rounded-3xl border shadow-glow"
          :class="toastClass"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div class="flex items-start gap-4 px-5 py-4">
            <div class="mt-1 h-2.5 w-2.5 rounded-full" :class="dotClass"></div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="text-sm font-semibold">{{ title }}</div>
                  <div class="mt-1 text-xs opacity-70">{{ timestamp }}</div>
                </div>
                <button
                  type="button"
                  class="rounded-full px-2 py-1 text-lg leading-none opacity-60 transition hover:opacity-100"
                  aria-label="Dismiss alert"
                  @click="dismiss"
                >
                  ×
                </button>
              </div>
              <p class="mt-3 text-sm leading-6">{{ message }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  type: { type: String, default: 'info' },
  message: { type: String, default: '' },
  title: { type: String, default: '' },
  autoDismissMs: { type: Number, default: 4000 },
})

const emit = defineEmits(['update:show', 'dismiss'])

const visible = ref(props.show)
const timestamp = ref('')
let timeoutId = null

const toastClass = computed(() => ({
  'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/70 dark:text-emerald-100':
    props.type === 'success',
  'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/70 dark:text-rose-100':
    props.type === 'danger',
  'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/70 dark:text-amber-100':
    props.type === 'warning',
  'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/70 dark:text-cyan-100':
    props.type === 'info',
}))

const dotClass = computed(() => ({
  'bg-emerald-500': props.type === 'success',
  'bg-rose-500': props.type === 'danger',
  'bg-amber-500': props.type === 'warning',
  'bg-cyan-500': props.type === 'info',
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

  timestamp.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

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
.erp-toast-enter-active,
.erp-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.erp-toast-enter-from,
.erp-toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
