<template>
  <div
    class="erp-page-blur-skeleton"
    :class="`erp-page-blur-skeleton--${variant}`"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="erp-page-blur-skeleton__wash"></div>
    <div class="erp-page-blur-skeleton__glow erp-page-blur-skeleton__glow--one"></div>
    <div class="erp-page-blur-skeleton__glow erp-page-blur-skeleton__glow--two"></div>

    <div class="erp-page-blur-skeleton__center">
      <div class="erp-page-blur-skeleton__pulse"></div>
      <div class="erp-page-blur-skeleton__label">Loading</div>
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
.erp-page-blur-skeleton {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(191, 205, 224, 0.62);
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.16)),
    linear-gradient(135deg, rgba(88, 135, 255, 0.12), transparent 46%),
    linear-gradient(220deg, rgba(34, 211, 238, 0.08), transparent 62%),
    linear-gradient(315deg, rgba(251, 146, 60, 0.08), transparent 70%);
  box-shadow:
    0 24px 60px rgba(54, 65, 154, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(28px) saturate(170%);
  -webkit-backdrop-filter: blur(28px) saturate(170%);
  isolation: isolate;
}

.erp-page-blur-skeleton--form {
  min-height: 26rem;
}

.erp-page-blur-skeleton--detail {
  min-height: 30rem;
}

.erp-page-blur-skeleton--settings {
  min-height: 36rem;
}

.erp-page-blur-skeleton__wash {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08) 36%, rgba(255, 255, 255, 0.14) 100%);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.erp-page-blur-skeleton__glow {
  position: absolute;
  border-radius: 9999px;
  filter: blur(10px);
  opacity: 0.85;
  animation: erp-page-blur-float 9s ease-in-out infinite;
}

.erp-page-blur-skeleton__glow--one {
  left: -4rem;
  top: -3rem;
  width: 14rem;
  height: 14rem;
  background: radial-gradient(circle, rgba(88, 135, 255, 0.28) 0%, rgba(88, 135, 255, 0.08) 48%, transparent 72%);
}

.erp-page-blur-skeleton__glow--two {
  right: -4rem;
  bottom: -4rem;
  width: 16rem;
  height: 16rem;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, rgba(251, 146, 60, 0.12) 44%, transparent 72%);
  animation-delay: -4s;
}

.erp-page-blur-skeleton__center {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: inherit;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 2rem;
}

.erp-page-blur-skeleton__pulse {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.18)),
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.58), transparent 55%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    0 18px 34px rgba(58, 123, 255, 0.12);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  animation: erp-page-blur-pulse 1.8s ease-in-out infinite;
}

.erp-page-blur-skeleton__label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(56, 80, 110, 0.74);
}

.dark .erp-page-blur-skeleton {
  border-color: rgba(100, 116, 139, 0.26);
  background:
    linear-gradient(160deg, rgba(18, 26, 46, 0.5), rgba(10, 16, 30, 0.2)),
    linear-gradient(135deg, rgba(99, 102, 241, 0.16), transparent 48%),
    linear-gradient(220deg, rgba(34, 211, 238, 0.1), transparent 64%),
    linear-gradient(315deg, rgba(236, 72, 153, 0.08), transparent 72%);
  box-shadow:
    0 28px 72px rgba(2, 6, 23, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.dark .erp-page-blur-skeleton__wash {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.16), rgba(15, 23, 42, 0.06) 36%, rgba(15, 23, 42, 0.12) 100%);
}

.dark .erp-page-blur-skeleton__glow--one {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0.06) 48%, transparent 72%);
}

.dark .erp-page-blur-skeleton__glow--two {
  background: radial-gradient(circle, rgba(34, 211, 238, 0.16) 0%, rgba(236, 72, 153, 0.08) 44%, transparent 72%);
}

.dark .erp-page-blur-skeleton__pulse {
  border-color: rgba(148, 163, 184, 0.28);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.52), rgba(15, 23, 42, 0.18)),
    radial-gradient(circle at 35% 30%, rgba(191, 219, 254, 0.14), transparent 55%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 18px 34px rgba(15, 23, 42, 0.18);
}

.dark .erp-page-blur-skeleton__label {
  color: rgba(203, 213, 225, 0.72);
}

@keyframes erp-page-blur-pulse {
  0% {
    transform: scale(0.96);
    opacity: 0.78;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(0.96);
    opacity: 0.78;
  }
}

@keyframes erp-page-blur-float {
  0% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, 12px, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
}
</style>
