<template>
  <Transition name="erp-fade">
    <div
      v-if="show"
      class="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-white/80 backdrop-blur-sm dark:bg-slate-950/80"
    >
      <div class="erp-card mx-4 flex max-w-sm items-center gap-4 px-5 py-4">
        <span class="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-cyan-200 border-t-cyan-600 dark:border-cyan-900 dark:border-t-cyan-400"></span>
        <div>
          <div class="text-sm font-semibold text-slate-950 dark:text-white">{{ resolvedTitle }}</div>
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ resolvedMessage }}</div>
        </div>
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
const resolvedMessage = computed(() => props.message || t('loading.message'))
</script>

<style scoped>
.erp-fade-enter-active,
.erp-fade-leave-active {
  transition: opacity 0.2s ease;
}

.erp-fade-enter-from,
.erp-fade-leave-to {
  opacity: 0;
}
</style>
