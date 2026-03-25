<template>
  <AppModal
    :show="show"
    :title="t('confirmDelete.title')"
    icon="destructive action"
    size="md"
    @close="$emit('close')"
  >
    <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">
      {{ t('confirmDelete.bodyBefore') }}
      <strong class="font-semibold text-slate-950 dark:text-white">{{ itemName || t('confirmDelete.fallbackName') }}</strong>{{ t('confirmDelete.bodyAfter') }}
    </p>

    <template #footer>
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" class="erp-button-secondary" :disabled="loading" @click="$emit('close')">
          {{ t('confirmDelete.cancel') }}
        </button>
        <button type="button" class="erp-button-danger" :disabled="loading" @click="$emit('confirm')">
          <span
            v-if="loading"
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          ></span>
          {{ t('confirmDelete.delete') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppModal from './AppModal.vue'

const { t } = useI18n()

defineProps({
  show: { type: Boolean, default: false },
  itemName: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])
</script>
