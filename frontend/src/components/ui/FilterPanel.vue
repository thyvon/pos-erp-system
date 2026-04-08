<template>
  <section class="relative z-10 overflow-visible rounded-[20px] border border-white/40 bg-transparent shadow-none dark:border-slate-700/60">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-white/10 dark:hover:bg-white/[0.04]"
      :class="expanded ? 'rounded-t-[20px]' : 'rounded-[20px]'"
      @click="$emit('update:expanded', !expanded)"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/35 text-slate-600 backdrop-blur-md dark:border-slate-600/70 dark:bg-white/[0.05] dark:text-slate-200">
            <i class="fa-solid fa-filter text-xs"></i>
          </span>
          <span class="text-sm font-semibold text-slate-950 dark:text-white">{{ title }}</span>
          <span
            class="erp-badge erp-badge-info px-2 py-1 text-[10px] font-medium"
          >
            {{ activeCount }} active
          </span>
        </div>
        <div class="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
          {{ description }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="showClear"
          type="button"
          class="erp-button-secondary px-2.5 py-1.5 text-[11px]"
          @click.stop="$emit('clear')"
        >
          Clear
        </button>
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/55 bg-white/55 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-md dark:border-slate-600/70 dark:bg-[linear-gradient(180deg,rgba(24,33,58,0.9),rgba(12,18,35,0.78))] dark:text-slate-100 dark:shadow-[0_12px_24px_rgba(2,6,23,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <i class="fa-solid fa-chevron-down transition" :class="expanded ? 'rotate-180' : ''"></i>
        </span>
      </div>
    </button>

    <Transition
      @before-enter="handlePanelBeforeEnter"
      @enter="handlePanelEnter"
      @after-enter="handlePanelAfterEnter"
      @before-leave="handlePanelBeforeLeave"
      @leave="handlePanelLeave"
      @after-leave="handlePanelAfterLeave"
    >
      <div
        v-if="expanded"
        class="erp-filter-panel-shell"
      >
        <div class="erp-filter-panel-body rounded-b-[20px] border-t border-white/40 bg-transparent px-3.5 py-3 dark:border-slate-700/70">
          <slot />
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Filters' },
  description: { type: String, default: '' },
  activeCount: { type: Number, default: 0 },
  expanded: { type: Boolean, default: false },
  showClear: { type: Boolean, default: false },
})

defineEmits(['update:expanded', 'clear'])

const getPanelTransition = () => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'none'
  }

  return [
    'height 300ms cubic-bezier(0.22, 1, 0.36, 1)',
    'opacity 220ms ease',
  ].join(', ')
}

const preparePanelElement = (element) => {
  element.style.overflow = 'hidden'
  element.style.willChange = 'height, opacity'
}

const getPanelBody = (element) => element.firstElementChild

const preparePanelBody = (element) => {
  const body = getPanelBody(element)

  if (!body) {
    return null
  }

  body.style.willChange = 'opacity, transform'
  return body
}

const handlePanelBeforeEnter = (element) => {
  preparePanelElement(element)
  const body = preparePanelBody(element)
  element.style.height = '0px'
  element.style.opacity = '0.55'

  if (body) {
    body.style.opacity = '0'
    body.style.transform = 'translateY(-6px)'
  }
}

const handlePanelEnter = (element) => {
  preparePanelElement(element)
  const body = preparePanelBody(element)
  element.style.transition = getPanelTransition()
  if (body) {
    body.style.transition = 'opacity 220ms ease 40ms, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'
  }

  requestAnimationFrame(() => {
    element.style.height = `${element.scrollHeight}px`
    element.style.opacity = '1'

    if (body) {
      body.style.opacity = '1'
      body.style.transform = 'translateY(0)'
    }
  })
}

const handlePanelAfterEnter = (element) => {
  const body = getPanelBody(element)
  element.style.height = 'auto'
  element.style.overflow = ''
  element.style.transition = ''
  element.style.opacity = ''
  element.style.willChange = ''

  if (body) {
    body.style.transition = ''
    body.style.opacity = ''
    body.style.transform = ''
    body.style.willChange = ''
  }
}

const handlePanelBeforeLeave = (element) => {
  preparePanelElement(element)
  const body = preparePanelBody(element)
  element.style.height = `${element.scrollHeight}px`
  element.style.opacity = '1'

  if (body) {
    body.style.opacity = '1'
    body.style.transform = 'translateY(0)'
  }
}

const handlePanelLeave = (element) => {
  preparePanelElement(element)
  const body = preparePanelBody(element)
  element.style.transition = getPanelTransition()
  void element.offsetHeight

  if (body) {
    body.style.transition = 'opacity 160ms ease, transform 220ms ease'
  }

  requestAnimationFrame(() => {
    element.style.height = '0px'
    element.style.opacity = '0'

    if (body) {
      body.style.opacity = '0'
      body.style.transform = 'translateY(-4px)'
    }
  })
}

const handlePanelAfterLeave = (element) => {
  const body = getPanelBody(element)
  element.style.overflow = ''
  element.style.transition = ''
  element.style.height = ''
  element.style.opacity = ''
  element.style.willChange = ''

  if (body) {
    body.style.transition = ''
    body.style.opacity = ''
    body.style.transform = ''
    body.style.willChange = ''
  }
}
</script>
