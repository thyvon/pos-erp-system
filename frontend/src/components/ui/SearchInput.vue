<template>
  <div class="relative">
    <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13 13l4 4" stroke-linecap="round" />
      </svg>
    </span>

    <input
      :value="modelValue"
      type="text"
      inputmode="search"
      enterkeyhint="search"
      class="erp-input pl-11 pr-11"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <button
      v-if="modelValue"
      type="button"
      class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
      @click="$emit('update:modelValue', '')"
    >
      <span class="text-lg leading-none">×</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search...' },
})

defineEmits(['update:modelValue'])
</script>
