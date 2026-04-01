<template>
  <div class="space-y-5">
    <div class="erp-skeleton-card">
      <div class="erp-skeleton-shimmer"></div>

      <template v-if="variant === 'settings'">
        <div class="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <div class="space-y-3">
            <div v-for="item in 5" :key="`settings-nav-${item}`" class="erp-skeleton-block h-16 w-full"></div>
          </div>
          <div class="space-y-5">
            <div class="space-y-3">
              <div class="erp-skeleton-line h-3 w-28"></div>
              <div class="erp-skeleton-line h-8 w-72"></div>
              <div class="erp-skeleton-line h-4 w-full max-w-3xl"></div>
            </div>
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div v-for="item in 8" :key="`settings-field-${item}`" class="space-y-2">
                <div class="erp-skeleton-line h-3 w-24"></div>
                <div class="erp-skeleton-block h-11 w-full"></div>
              </div>
            </div>
            <div class="erp-skeleton-block h-44 w-full"></div>
          </div>
        </div>
      </template>

      <template v-else-if="variant === 'detail'">
        <div class="space-y-5">
          <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div class="space-y-3">
              <div class="erp-skeleton-line h-8 w-72"></div>
              <div class="erp-skeleton-line h-4 w-full max-w-2xl"></div>
            </div>
            <div class="flex gap-2">
              <div class="erp-skeleton-block h-10 w-32"></div>
              <div class="erp-skeleton-block h-10 w-36"></div>
            </div>
          </div>
          <div class="grid gap-4 xl:grid-cols-2">
            <div class="erp-skeleton-block h-56 w-full"></div>
            <div class="erp-skeleton-block h-56 w-full"></div>
          </div>
          <div class="erp-skeleton-block h-72 w-full"></div>
        </div>
      </template>

      <template v-else>
        <div class="space-y-5">
          <div class="space-y-3">
            <div class="erp-skeleton-line h-3 w-24"></div>
            <div class="erp-skeleton-line h-7 w-56"></div>
            <div class="erp-skeleton-line h-4 w-full max-w-2xl"></div>
          </div>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in 6" :key="`form-field-${item}`" class="space-y-2">
              <div class="erp-skeleton-line h-3 w-20"></div>
              <div class="erp-skeleton-block h-11 w-full"></div>
            </div>
          </div>
          <div class="erp-skeleton-block h-24 w-full"></div>
          <div class="erp-skeleton-block h-64 w-full"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'form',
  },
})
</script>

<style scoped>
.erp-skeleton-card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.84));
  padding: 1.5rem;
  box-shadow: 0 18px 45px rgba(56, 77, 112, 0.08);
  backdrop-filter: blur(18px);
}

.dark .erp-skeleton-card {
  border-color: rgba(51, 65, 85, 0.85);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.76));
  box-shadow: 0 20px 50px rgba(2, 6, 23, 0.4);
}

.erp-skeleton-shimmer {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, transparent 0%, rgba(255, 255, 255, 0.24) 42%, rgba(255, 255, 255, 0.55) 50%, rgba(255, 255, 255, 0.24) 58%, transparent 100%);
  transform: translateX(-120%);
  animation: erp-skeleton-shimmer 1.6s ease-in-out infinite;
  pointer-events: none;
}

.dark .erp-skeleton-shimmer {
  background:
    linear-gradient(105deg, transparent 0%, rgba(148, 163, 184, 0.05) 42%, rgba(148, 163, 184, 0.12) 50%, rgba(148, 163, 184, 0.05) 58%, transparent 100%);
}

.erp-skeleton-line,
.erp-skeleton-block {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(226, 232, 240, 0.78), rgba(226, 232, 240, 0.52));
  filter: blur(0.2px);
}

.dark .erp-skeleton-line,
.dark .erp-skeleton-block {
  background:
    linear-gradient(180deg, rgba(51, 65, 85, 0.92), rgba(30, 41, 59, 0.78));
}

@keyframes erp-skeleton-shimmer {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(120%);
  }
}
</style>
