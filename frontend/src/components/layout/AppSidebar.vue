<template>
  <div
    v-if="isDesktop"
    class="erp-sidebar-brand fixed left-0 top-0 z-30 flex h-[64px] items-center px-3.5"
    :style="desktopBrandStyle"
  >
    <RouterLink to="/dashboard" class="flex min-w-0 items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(208,230,255,0.92)_55%,rgba(90,152,255,0.95))] text-base font-bold text-slate-950 shadow-[0_18px_30px_rgba(77,132,255,0.22)]">
        E
      </div>
      <div v-if="!sidebarCollapsed" class="min-w-0">
        <div class="erp-sidebar-brand-kicker text-[10px] font-semibold uppercase tracking-[0.24em]">
          POS ERP
        </div>
        <div class="erp-sidebar-brand-title mt-0.5 truncate text-[13px] font-medium">Liquid Workspace</div>
      </div>
    </RouterLink>
  </div>

  <aside
    class="erp-sidebar-shell fixed inset-y-0 left-0 z-50 flex w-[15rem] max-w-[88vw] flex-col overflow-hidden rounded-r-[28px] transition-all duration-300 lg:bottom-0 lg:top-[64px] lg:z-20 lg:max-w-none lg:rounded-none lg:translate-x-0"
    :style="desktopSidebarStyle"
    :class="[
      sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      sidebarCollapsed && isDesktop ? 'lg:z-40 lg:overflow-visible' : '',
    ]"
  >
    <div class="erp-sidebar-shell-bg absolute inset-0 rounded-r-[28px] lg:rounded-none"></div>
    <div class="erp-sidebar-shell-border absolute inset-0 rounded-r-[28px] lg:rounded-none"></div>
    <div class="erp-sidebar-shell-glow absolute inset-x-0 top-0 h-28 rounded-tr-[28px] lg:rounded-none"></div>

    <div v-if="!isDesktop" class="erp-sidebar-mobile-head relative flex min-h-[76px] items-center justify-between px-3.5 py-3.5">
      <RouterLink to="/dashboard" class="flex items-center gap-3" @click="emitClose">
        <div class="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(208,230,255,0.92)_55%,rgba(90,152,255,0.95))] text-base font-bold text-slate-950 shadow-[0_18px_30px_rgba(77,132,255,0.22)]">
          E
        </div>
        <div v-if="!sidebarCollapsed" class="min-w-0">
          <div class="erp-sidebar-brand-kicker text-[10px] font-semibold uppercase tracking-[0.24em]">
            POS ERP
          </div>
          <div class="erp-sidebar-brand-title mt-0.5 text-[13px] font-medium">Liquid Workspace</div>
        </div>
      </RouterLink>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="erp-sidebar-mobile-close rounded-[16px] px-2.5 py-1.5 text-sm lg:hidden"
          @click="emitClose"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <div
      ref="sidebarScrollRef"
      class="relative flex-1 overscroll-y-contain px-2.5 py-2.5 erp-sidebar-scroll"
      :class="sidebarScrollClasses"
      @mouseenter="sidebarHovered = true"
      @mouseleave="sidebarHovered = false"
      @scroll="handleSidebarScroll"
    >
      <div class="mt-0 space-y-0">
        <section v-for="group in navGroups" :key="group.label">
          <div class="space-y-0">
            <div
              v-for="item in group.items"
              :key="item.key || item.label"
              class="relative space-y-0"
              :class="
                item.children?.length && !sidebarCollapsed && isNavItemExpanded(item)
                  ? 'erp-sidebar-group-panel'
                  : ''
              "
              @mouseenter="handleCollapsedFlyoutEnter(item)"
              @mouseleave="handleCollapsedFlyoutLeave(item)"
            >
              <button
                v-if="item.children?.length"
                type="button"
                class="erp-sidebar-link w-full"
                :class="[
                  isItemActive(item)
                    ? sidebarCollapsed
                      ? 'erp-sidebar-link-active'
                      : 'erp-sidebar-parent-active'
                    : '',
                  !sidebarCollapsed ? 'erp-sidebar-parent-link' : '',
                ]"
                :title="sidebarCollapsed ? item.label : undefined"
                @click="handleParentNavItemClick(item, $event.currentTarget)"
              >
                <div
                  class="flex items-center gap-3"
                  :class="sidebarCollapsed ? 'w-full justify-center' : 'min-w-0 flex-1'"
                >
                  <span class="erp-nav-icon">
                    <i :class="item.icon"></i>
                  </span>
                  <div v-if="!sidebarCollapsed" class="min-w-0 text-left">
                    <div class="text-sm font-medium">{{ item.label }}</div>
                  </div>
                </div>
                <div v-if="!sidebarCollapsed" class="flex items-center gap-2">
                  <span class="erp-nav-badge" :class="item.statusClass">
                    {{ item.status }}
                  </span>
                  <i
                    class="fa-solid fa-chevron-down text-[11px] text-slate-500 transition"
                    :class="isNavItemExpanded(item) ? 'rotate-180' : ''"
                  ></i>
                </div>
              </button>

              <Transition
                @before-enter="handleTreeBeforeEnter"
                @enter="handleTreeEnter"
                @after-enter="handleTreeAfterEnter"
                @before-leave="handleTreeBeforeLeave"
                @leave="handleTreeLeave"
                @after-leave="handleTreeAfterLeave"
              >
                <div
                  v-if="item.children?.length && !sidebarCollapsed && isNavItemExpanded(item)"
                  class="erp-sidebar-tree-shell"
                >
                  <div class="erp-sidebar-tree">
                    <RouterLink
                      v-for="child in item.children"
                      :key="child.key || child.label"
                      :to="child.to"
                      class="erp-sidebar-link erp-sidebar-tree-link"
                      :class="isItemActive(child) ? 'erp-sidebar-link-active' : ''"
                      @click="handleItemNavigation"
                    >
                      <div class="flex min-w-0 items-center">
                        <div class="min-w-0">
                          <div class="text-sm font-medium">{{ child.label }}</div>
                        </div>
                      </div>
                      <span class="erp-nav-badge" :class="child.statusClass">
                        {{ child.status }}
                      </span>
                    </RouterLink>
                  </div>
                </div>
              </Transition>

              <div
                v-if="item.children?.length && isCollapsedDesktop && activeCollapsedFlyoutKey === item.key"
                class="erp-sidebar-flyout"
                @mouseenter="handleCollapsedFlyoutEnter(item)"
                @mouseleave="handleCollapsedFlyoutLeave(item)"
              >
                <div class="erp-sidebar-flyout-title">
                  <div class="erp-sidebar-flyout-title-text-wrap">
                    <span class="erp-sidebar-flyout-title-text">{{ item.label }}</span>
                  </div>
                  <span class="erp-nav-badge erp-sidebar-flyout-title-badge" :class="item.statusClass">
                    {{ item.status }}
                  </span>
                </div>

                <div class="mt-2 space-y-0">
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.key || child.label"
                    :to="child.to"
                    class="erp-sidebar-link erp-sidebar-flyout-link"
                    :class="isItemActive(child) ? 'erp-sidebar-link-active' : ''"
                    @click="handleItemNavigation"
                  >
                    <div class="flex min-w-0 items-center">
                      <div class="min-w-0 text-left">
                        <div class="text-sm font-medium">{{ child.label }}</div>
                      </div>
                    </div>
                    <span class="erp-nav-badge" :class="child.statusClass">
                      {{ child.status }}
                    </span>
                  </RouterLink>
                </div>
              </div>

              <component
                v-if="!item.children?.length"
                :is="item.to ? RouterLink : 'a'"
                :to="item.to"
                :href="item.to ? undefined : 'javascript:void(0)'"
                class="erp-sidebar-link"
                :class="[
                  isItemActive(item) ? 'erp-sidebar-link-active' : '',
                  !sidebarCollapsed ? 'erp-sidebar-compact-link' : '',
                ]"
                :title="sidebarCollapsed ? item.label : undefined"
                @click="handleItemNavigation"
              >
                <div
                  class="flex items-center gap-3"
                  :class="sidebarCollapsed ? 'w-full justify-center' : 'min-w-0 flex-1'"
                >
                  <span class="erp-nav-icon">
                    <i :class="item.icon"></i>
                  </span>
                  <div v-if="!sidebarCollapsed" class="min-w-0 text-left">
                    <div class="text-sm font-medium">{{ item.label }}</div>
                  </div>
                </div>
                <span v-if="!sidebarCollapsed" class="erp-nav-badge" :class="item.statusClass">
                  {{ item.status }}
                </span>
              </component>
            </div>
          </div>
        </section>
      </div>

      <div v-if="!sidebarCollapsed" class="erp-sidebar-callout mt-6 rounded-[22px] p-3.5">
        <div class="erp-sidebar-callout-kicker text-[11px] font-semibold uppercase tracking-[0.22em]">
          {{ t('layout.nextBuildTarget') }}
        </div>
        <div class="erp-sidebar-callout-title mt-2 text-base font-semibold">{{ t('layout.nextBuildTitle') }}</div>
        <p class="erp-sidebar-callout-body mt-2 text-sm leading-6">
          {{ t('layout.nextBuildBody') }}
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@stores/auth'
import { useSidebarBehavior } from '@/composables/useSidebarBehavior'
import { createSidebarGroups } from '@/navigation/sidebar'

const props = defineProps({
  desktopBrandStyle: {
    type: Object,
    required: true,
  },
  desktopSidebarStyle: {
    type: Object,
    required: true,
  },
  isDesktop: {
    type: Boolean,
    required: true,
  },
  sidebarCollapsed: {
    type: Boolean,
    required: true,
  },
  sidebarOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close'])

const auth = useAuthStore()
const route = useRoute()
const { t } = useI18n()

const navGroups = computed(() =>
  createSidebarGroups({
    t,
    auth,
    isSuperAdmin: auth.isSuperAdmin,
  })
)

const {
  activeCollapsedFlyoutKey,
  clearCollapsedFlyout,
  handleCollapsedFlyoutEnter,
  handleCollapsedFlyoutLeave,
  handleParentNavItemClick,
  handleSidebarScroll,
  isCollapsedDesktop,
  isItemActive,
  isNavItemExpanded,
  sidebarHovered,
  sidebarScrollClasses,
  sidebarScrollRef,
} = useSidebarBehavior({
  isDesktop: toRef(props, 'isDesktop'),
  navGroups,
  route,
  sidebarCollapsed: toRef(props, 'sidebarCollapsed'),
})

const emitClose = () => {
  clearCollapsedFlyout()
  emit('close')
}

const handleItemNavigation = () => {
  emitClose()
}

const getSidebarTreeTransition = () => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'none'
  }

  return [
    'height 460ms cubic-bezier(0.2, 0.9, 0.2, 1)',
    'opacity 420ms cubic-bezier(0.16, 1, 0.3, 1)',
    'transform 460ms cubic-bezier(0.2, 0.9, 0.2, 1)',
  ].join(', ')
}

const prepareTreeElement = (element) => {
  element.style.overflow = 'hidden'
  element.style.transformOrigin = 'top center'
}

const handleTreeBeforeEnter = (element) => {
  prepareTreeElement(element)
  element.style.height = '0px'
  element.style.opacity = '0'
  element.style.transform = 'translateY(-10px)'
}

const handleTreeEnter = (element) => {
  prepareTreeElement(element)
  element.style.transition = getSidebarTreeTransition()

  requestAnimationFrame(() => {
    element.style.height = `${element.scrollHeight}px`
    element.style.opacity = '1'
    element.style.transform = 'translateY(0)'
  })
}

const handleTreeAfterEnter = (element) => {
  element.style.height = 'auto'
  element.style.overflow = ''
  element.style.transition = ''
  element.style.opacity = ''
  element.style.transform = ''
}

const handleTreeBeforeLeave = (element) => {
  prepareTreeElement(element)
  element.style.height = `${element.scrollHeight}px`
  element.style.opacity = '1'
  element.style.transform = 'translateY(0)'
}

const handleTreeLeave = (element) => {
  prepareTreeElement(element)
  element.style.transition = getSidebarTreeTransition()
  void element.offsetHeight

  requestAnimationFrame(() => {
    element.style.height = '0px'
    element.style.opacity = '0'
    element.style.transform = 'translateY(-10px)'
  })
}

const handleTreeAfterLeave = (element) => {
  element.style.overflow = ''
  element.style.transition = ''
  element.style.height = ''
  element.style.opacity = ''
  element.style.transform = ''
}
</script>
