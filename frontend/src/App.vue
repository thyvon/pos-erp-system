<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="erp-route" mode="out-in">
      <div :key="getRouteTransitionKey(route)" class="erp-route-shell">
        <component :is="Component" />
      </div>
    </Transition>
  </RouterView>
</template>

<script setup>
import { RouterView } from 'vue-router'

const getRouteTransitionKey = (route) => route.path
</script>

<style scoped>
.erp-route-shell {
  position: relative;
  min-height: 100vh;
}

.erp-route-enter-active,
.erp-route-leave-active {
  transition: none;
}

:deep(.erp-route-content) {
  transition: opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity;
}

.erp-route-enter-active :deep(.erp-route-content),
.erp-route-leave-active :deep(.erp-route-content) {
  transition: opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.erp-route-enter-from :deep(.erp-route-content) {
  opacity: 0;
}

.erp-route-leave-to :deep(.erp-route-content) {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .erp-route-enter-active,
  .erp-route-leave-active {
    transition: none;
  }

  :deep(.erp-route-content),
  .erp-route-enter-active :deep(.erp-route-content),
  .erp-route-leave-active :deep(.erp-route-content) {
    transition: none;
  }

  .erp-route-enter-from :deep(.erp-route-content),
  .erp-route-leave-to :deep(.erp-route-content) {
    opacity: 1;
  }
}
</style>
