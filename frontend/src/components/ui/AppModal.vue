<template>
  <Teleport to="body">
    <Transition name="erp-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 px-3 py-4 backdrop-blur-md"
        @click.self="handleBackdrop"
      >
        <div
          class="w-full overflow-hidden rounded-[5px] border border-white/60 bg-white/80 shadow-[0_30px_90px_rgba(56,77,112,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80"
          :class="sizeClass"
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
              class="inline-flex h-10 w-10 items-center justify-center rounded-[5px] border border-slate-200/80 bg-white/70 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
              aria-label="Close modal"
              @click="$emit('close')"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="max-h-[70vh] overflow-y-auto px-4 py-4">
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
})

const emit = defineEmits(['close'])

const sizeClass = computed(() => ({
  'max-w-md': props.size === 'sm',
  'max-w-2xl': props.size === 'md',
  'max-w-4xl': props.size === 'lg',
  'max-w-5xl': props.size === 'xl',
}))

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
