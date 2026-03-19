<template>
  <AppModal
    :show="show"
    title="Delete record"
    icon="destructive action"
    size="md"
    @close="$emit('close')"
  >
    <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">
      Are you sure you want to delete <strong class="font-semibold text-slate-950 dark:text-white">{{ itemName || 'this record' }}</strong>?
      This action can be reversed only if the backend keeps the record as a soft delete.
    </p>

    <template #footer>
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" class="erp-button-secondary" :disabled="loading" @click="$emit('close')">
          Cancel
        </button>
        <button type="button" class="erp-button-danger" :disabled="loading" @click="$emit('confirm')">
          <span
            v-if="loading"
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          ></span>
          Delete
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import AppModal from './AppModal.vue'

defineProps({
  show: { type: Boolean, default: false },
  itemName: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])
</script>
