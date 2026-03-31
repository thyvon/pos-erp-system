import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { collectActiveSidebarParents } from '@/navigation/sidebar'

const sidebarScrollStorageKey = 'erp_sidebar_scroll_top'

export function useSidebarBehavior({ isDesktop, navGroups, route, sidebarCollapsed }) {
  const activeCollapsedFlyoutKey = ref(null)
  const expandedNavItems = ref({})
  const sidebarHovered = ref(false)
  const sidebarScrollRef = ref(null)
  let collapsedFlyoutCloseTimeout = null

  const isCollapsedDesktop = computed(() => isDesktop.value && sidebarCollapsed.value)

  const isPathActive = (path) => route.path.startsWith(path)

  const isItemActive = (item) => {
    if (item.to && isPathActive(item.to)) {
      return true
    }

    if (item.children?.length) {
      return item.children.some((child) => isItemActive(child))
    }

    return false
  }

  const sidebarScrollClasses = computed(() => {
    if (!isDesktop.value) {
      return 'overflow-y-auto'
    }

    if (isCollapsedDesktop.value) {
      return 'overflow-visible'
    }

    return sidebarHovered.value ? 'overflow-y-auto' : 'overflow-y-hidden'
  })

  const syncExpandedNavItemsToActiveRoute = () => {
    const nextExpandedState = navGroups.value.reduce((accumulator, group) => {
      collectActiveSidebarParents(group.items, isItemActive, accumulator)
      return accumulator
    }, {})

    expandedNavItems.value = nextExpandedState
  }

  const isNavItemExpanded = (item) => {
    if (!item.children?.length || !item.key) {
      return false
    }

    return Boolean(expandedNavItems.value[item.key])
  }

  const toggleNavItem = (key) => {
    if (!key) {
      return
    }

    const isCurrentlyExpanded = Boolean(expandedNavItems.value[key])
    expandedNavItems.value = isCurrentlyExpanded ? {} : { [key]: true }
  }

  const handleParentNavItemClick = async (item, triggerElement = null) => {
    if (!item?.key) {
      return
    }

    if (isCollapsedDesktop.value) {
      activeCollapsedFlyoutKey.value = activeCollapsedFlyoutKey.value === item.key ? null : item.key
      return
    }

    const previousTop =
      triggerElement && sidebarScrollRef.value
        ? triggerElement.getBoundingClientRect().top - sidebarScrollRef.value.getBoundingClientRect().top
        : null

    toggleNavItem(item.key)

    if (previousTop === null || !sidebarScrollRef.value || !triggerElement) {
      return
    }

    await nextTick()

    const nextTop = triggerElement.getBoundingClientRect().top - sidebarScrollRef.value.getBoundingClientRect().top
    sidebarScrollRef.value.scrollTop += nextTop - previousTop
  }

  const clearCollapsedFlyoutCloseTimeout = () => {
    if (collapsedFlyoutCloseTimeout) {
      clearTimeout(collapsedFlyoutCloseTimeout)
      collapsedFlyoutCloseTimeout = null
    }
  }

  const scheduleCollapsedFlyoutClose = (itemKey) => {
    clearCollapsedFlyoutCloseTimeout()
    collapsedFlyoutCloseTimeout = setTimeout(() => {
      if (activeCollapsedFlyoutKey.value === itemKey) {
        activeCollapsedFlyoutKey.value = null
      }
    }, 180)
  }

  const handleCollapsedFlyoutEnter = (item) => {
    if (!isCollapsedDesktop.value || !item?.children?.length || !item.key) {
      return
    }

    clearCollapsedFlyoutCloseTimeout()
    activeCollapsedFlyoutKey.value = item.key
  }

  const handleCollapsedFlyoutLeave = (item) => {
    if (!isCollapsedDesktop.value || !item?.children?.length || !item.key) {
      return
    }

    scheduleCollapsedFlyoutClose(item.key)
  }

  const clearCollapsedFlyout = () => {
    clearCollapsedFlyoutCloseTimeout()
    activeCollapsedFlyoutKey.value = null
  }

  const handleSidebarScroll = () => {
    if (!sidebarScrollRef.value) {
      return
    }

    localStorage.setItem(sidebarScrollStorageKey, String(sidebarScrollRef.value.scrollTop))
  }

  watch(
    () => route.fullPath,
    () => {
      syncExpandedNavItemsToActiveRoute()
      clearCollapsedFlyout()
      sidebarHovered.value = false
    }
  )

  watch(
    navGroups,
    () => {
      syncExpandedNavItemsToActiveRoute()
    },
    { immediate: true }
  )

  watch(isCollapsedDesktop, (collapsedDesktop) => {
    if (!collapsedDesktop) {
      clearCollapsedFlyout()
    }
  })

  onMounted(() => {
    nextTick(() => {
      const storedScrollTop = Number(localStorage.getItem(sidebarScrollStorageKey) || '0')

      if (sidebarScrollRef.value && Number.isFinite(storedScrollTop) && storedScrollTop > 0) {
        sidebarScrollRef.value.scrollTop = storedScrollTop
      }
    })
  })

  return {
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
  }
}
