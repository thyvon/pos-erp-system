<template>
  <Transition name="erp-top-progress-fade">
    <div
      v-if="show"
      class="rounded-[5px] border border-cyan-200/70 bg-cyan-50/75 px-4 py-3 dark:border-cyan-900/50 dark:bg-cyan-950/20"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
          {{ resolvedTitle }}
        </div>
        <div v-if="resolvedMessage" class="text-xs text-slate-600 dark:text-slate-300">
          {{ resolvedMessage }}
        </div>
      </div>

      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-cyan-100 dark:bg-cyan-950/50">
        <div class="erp-top-progress-bar h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
})

const { t } = useI18n()

const resolvedTitle = computed(() => props.title || t('loading.title'))
const resolvedMessage = computed(() => props.message || '')
</script>

<style scoped>
.erp-top-progress-fade-enter-active,
.erp-top-progress-fade-leave-active {
  transition: opacity 0.2s ease;
}

.erp-top-progress-fade-enter-from,
.erp-top-progress-fade-leave-to {
  opacity: 0;
}

.erp-top-progress-bar {
  width: 42%;
  animation: erp-top-progress-slide 1.25s ease-in-out infinite;
}

@keyframes erp-top-progress-slide {
  0% {
    transform: translateX(-110%) scaleX(0.45);
  }

  50% {
    transform: translateX(85%) scaleX(0.9);
  }

  100% {
    transform: translateX(230%) scaleX(0.45);
  }
}
</style>
