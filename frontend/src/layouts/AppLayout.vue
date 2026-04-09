<template>
  <div class="erp-shell min-h-screen">
    <div class="erp-bg-orbs" aria-hidden="true">
      <div class="erp-bg-orb-node erp-bg-orb-node-a">
        <div class="erp-bg-orb erp-bg-orb-a"></div>
      </div>
      <div class="erp-bg-orb-node erp-bg-orb-node-b">
        <div class="erp-bg-orb erp-bg-orb-b"></div>
      </div>
      <div class="erp-bg-orb-node erp-bg-orb-node-c">
        <div class="erp-bg-orb erp-bg-orb-c"></div>
      </div>
    </div>
    <div class="relative min-h-screen">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-slate-950/28 backdrop-blur-md lg:hidden"
        @click="sidebarOpen = false"
      ></div>

      <header v-if="isDesktop" class="fixed top-0 z-30" :style="desktopHeaderStyle">
        <div class="erp-panel-float erp-shell-bar flex min-h-[64px] w-full items-center justify-between gap-2.5 rounded-none border-x-0 border-t-0 px-3.5 py-2 lg:px-5">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="erp-sidebar-dock-toggle inline-flex"
              :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              @click="toggleSidebarCollapsed"
            >
              <i class="fa-solid" :class="sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
            </button>
            <ol class="hidden md:flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <li v-for="(item, index) in breadcrumbs" :key="item.label" class="flex items-center gap-2">
                <span v-if="index > 0" class="text-slate-300 dark:text-slate-700">/</span>
                <RouterLink
                  v-if="item.to"
                  :to="item.to"
                  class="hover:text-slate-900 dark:hover:text-white"
                >
                  {{ item.label }}
                </RouterLink>
                <span v-else>{{ item.label }}</span>
              </li>
            </ol>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <div class="erp-glass-band hidden items-center gap-2 px-2.5 py-1 text-[13px] text-slate-600 dark:text-slate-300 xl:flex">
              <div class="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
              <span>{{ t('layout.backendConnected') }}</span>
            </div>
            <NotificationBell />
            <button
              type="button"
              class="erp-topbar-button"
              :title="t('common.language')"
              @click="toggleLocale"
            >
              <i class="fa-solid fa-language"></i>
              <span>{{ currentLocaleLabel }}</span>
            </button>
            <button type="button" class="erp-topbar-button" @click="toggleTheme">
              <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
            </button>
            <div ref="userMenuRef" class="relative">
              <button
                type="button"
                class="erp-topbar-user-chip"
                :aria-expanded="userMenuOpen ? 'true' : 'false'"
                aria-haspopup="menu"
                @click="toggleUserMenu"
              >
                <div class="erp-user-avatar erp-user-avatar-topbar-compact">
                  <img
                    v-if="userAvatarUrl"
                    :src="userAvatarUrl"
                    :alt="userDisplayName"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ userInitials }}</span>
                </div>
                <i
                  class="fa-solid fa-chevron-down text-[11px] text-slate-500 transition dark:text-slate-400"
                  :class="userMenuOpen ? 'rotate-180' : ''"
                ></i>
              </button>

              <div v-if="userMenuOpen" class="erp-topbar-user-menu" role="menu">
                <div class="border-b border-slate-200/70 px-3 py-2.5 dark:border-slate-800/80">
                  <div class="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {{ userDisplayName }}
                  </div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {{ auth.user?.email || auth.user?.roles?.[0] || 'User' }}
                  </div>
                </div>
                <button type="button" class="erp-topbar-user-menu-item" role="menuitem" @click="handleLogout">
                  <i class="fa-solid fa-arrow-right-from-bracket"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AppSidebar
        :desktop-brand-style="desktopBrandStyle"
        :desktop-sidebar-style="desktopSidebarStyle"
        :is-desktop="isDesktop"
        :sidebar-collapsed="sidebarCollapsed"
        :sidebar-open="sidebarOpen"
        @close="sidebarOpen = false"
      />

      <div class="erp-main-wrap min-w-0 overflow-x-hidden" :style="mainWrapStyle">
        <header v-if="!isDesktop" class="sticky top-0 z-30">
          <div class="erp-panel-float erp-shell-bar flex min-h-[64px] w-full items-center justify-between gap-2.5 rounded-none border-x-0 border-t-0 px-3.5 py-2 lg:px-5">
            <div class="flex items-center gap-3">
              <button type="button" class="erp-topbar-button lg:hidden" @click="sidebarOpen = true">
                <i class="fa-solid fa-bars"></i>
                <span>{{ t('common.menu') }}</span>
              </button>
              <button
                type="button"
                class="erp-sidebar-dock-toggle hidden lg:inline-flex"
                :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                @click="toggleSidebarCollapsed"
              >
                <i class="fa-solid" :class="sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
              </button>
              <ol class="hidden md:flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <li v-for="(item, index) in breadcrumbs" :key="item.label" class="flex items-center gap-2">
                  <span v-if="index > 0" class="text-slate-300 dark:text-slate-700">/</span>
                  <RouterLink
                    v-if="item.to"
                    :to="item.to"
                    class="hover:text-slate-900 dark:hover:text-white"
                  >
                    {{ item.label }}
                  </RouterLink>
                  <span v-else>{{ item.label }}</span>
                </li>
              </ol>
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
              <div class="erp-glass-band hidden items-center gap-2 px-2.5 py-1 text-[13px] text-slate-600 dark:text-slate-300 xl:flex">
                <div class="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                <span>{{ t('layout.backendConnected') }}</span>
              </div>
              <NotificationBell />
              <button type="button" class="erp-topbar-button" :title="t('common.language')" @click="toggleLocale">
                <i class="fa-solid fa-language"></i>
                <span>{{ currentLocaleLabel }}</span>
              </button>
              <button type="button" class="erp-topbar-button" @click="toggleTheme">
                <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
              </button>
              <div ref="userMenuRef" class="relative">
                <button
                  type="button"
                  class="erp-topbar-user-chip"
                  :aria-expanded="userMenuOpen ? 'true' : 'false'"
                  aria-haspopup="menu"
                  @click="toggleUserMenu"
                >
                  <div class="erp-user-avatar erp-user-avatar-topbar-compact">
                    <img
                      v-if="userAvatarUrl"
                      :src="userAvatarUrl"
                      :alt="userDisplayName"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>{{ userInitials }}</span>
                  </div>
                  <i
                    class="fa-solid fa-chevron-down text-[11px] text-slate-500 transition dark:text-slate-400"
                    :class="userMenuOpen ? 'rotate-180' : ''"
                  ></i>
                </button>

                <div v-if="userMenuOpen" class="erp-topbar-user-menu" role="menu">
                  <div class="border-b border-slate-200/70 px-3 py-2.5 dark:border-slate-800/80">
                    <div class="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {{ userDisplayName }}
                    </div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {{ auth.user?.email || auth.user?.roles?.[0] || t('common.user') }}
                    </div>
                  </div>
                  <button type="button" class="erp-topbar-user-menu-item" role="menuitem" @click="handleLogout">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>{{ t('layout.logout') }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main class="min-h-full px-0 py-0">
          <div class="erp-route-content w-full px-3.5 py-3.5 pb-32 lg:px-5 lg:py-4 lg:pb-32">
            <slot />
          </div>
        </main>

        <footer
          class="fixed bottom-0 right-0 z-20 bg-transparent px-0 py-0 text-sm text-slate-500 dark:text-slate-400"
          :style="footerDesktopStyle"
        >
          <div class="erp-panel-float erp-shell-bar erp-footer-bar flex w-full flex-col gap-2.5 rounded-none border-x-0 border-b-0 px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between lg:px-5">
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {{ appName }}
              </div>
              <div class="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
                {{ t('layout.footerDescription') }}
              </div>
            </div>
            <div class="flex flex-col items-start gap-1 text-left sm:items-end">
              <div class="text-[13px] font-medium text-slate-700 dark:text-slate-200">{{ today }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ currentYear }} © {{ t('layout.allRightsReserved') }}</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@stores/auth'
import { applyLocale } from '@/i18n'
import AppSidebar from '@components/layout/AppSidebar.vue'
import NotificationBell from '@components/ui/NotificationBell.vue'
import { formatHumanLongDate } from '@/utils/date'

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
})

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('erp_sidebar_collapsed') === 'true')
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
const isDark = ref(document.documentElement.classList.contains('dark'))
const userMenuOpen = ref(false)
const userMenuRef = ref(null)

const themeKey = 'erp_theme'
const appName = import.meta.env.VITE_APP_NAME || 'ERP System'
const expandedSidebarWidth = '15rem'
const collapsedSidebarWidth = '4.75rem'
const currentYear = new Date().getFullYear()

const isDesktop = computed(() => viewportWidth.value >= 1024)
const currentLocaleLabel = computed(() => (locale.value === 'km' ? 'KM' : 'EN'))

const today = computed(() => formatHumanLongDate(new Date()))

const userDisplayName = computed(() => {
  const fullName = auth.user?.full_name?.trim()

  if (fullName) {
    return fullName
  }

  const joined = [auth.user?.first_name, auth.user?.last_name].filter(Boolean).join(' ').trim()

  if (joined) {
    return joined
  }

  return auth.user?.email || t('common.user')
})

const userAvatarUrl = computed(() => auth.user?.avatar_url || '')

const userInitials = computed(() => {
  const source = userDisplayName.value

  if (!source) {
    return 'ER'
  }

  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) {
    return 'ER'
  }

  return parts.map((part) => part[0]).join('').toUpperCase()
})

const desktopSidebarStyle = computed(() => ({
  width: sidebarCollapsed.value ? collapsedSidebarWidth : expandedSidebarWidth,
}))

const desktopBrandStyle = computed(() => ({
  width: sidebarCollapsed.value ? collapsedSidebarWidth : expandedSidebarWidth,
}))

const desktopHeaderStyle = computed(() => ({
  left: isDesktop.value ? (sidebarCollapsed.value ? collapsedSidebarWidth : expandedSidebarWidth) : '0',
  right: '0',
}))

const mainWrapStyle = computed(() => ({
  marginLeft: isDesktop.value ? (sidebarCollapsed.value ? collapsedSidebarWidth : expandedSidebarWidth) : '0',
  paddingTop: isDesktop.value ? '64px' : '0',
  paddingBottom: isDesktop.value ? '5.25rem' : '6rem',
}))

const footerDesktopStyle = computed(() => ({
  left: isDesktop.value ? (sidebarCollapsed.value ? collapsedSidebarWidth : expandedSidebarWidth) : '0',
}))

const toggleTheme = () => {
  const root = document.documentElement
  const nextDark = !isDark.value

  root.classList.toggle('dark', nextDark)
  isDark.value = nextDark
  localStorage.setItem(themeKey, nextDark ? 'dark' : 'light')
}

const toggleLocale = async () => {
  const nextLocale = locale.value === 'en' ? 'km' : 'en'

  if (auth.isLoggedIn) {
    try {
      await auth.updateLocalePreference(nextLocale)
      return
    } catch {
      // Fallback to client-only locale switch if the preferences request fails.
    }
  }

  applyLocale(nextLocale)
}

const toggleSidebarCollapsed = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('erp_sidebar_collapsed', String(sidebarCollapsed.value))
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const handleLogout = async () => {
  closeUserMenu()
  await auth.logout()
  await router.push('/login')
}

const handleResize = () => {
  viewportWidth.value = window.innerWidth
}

const handleDocumentPointerDown = (event) => {
  if (!userMenuOpen.value) {
    return
  }

  if (userMenuRef.value?.contains(event.target)) {
    return
  }

  closeUserMenu()
}

const handleDocumentKeyDown = (event) => {
  if (event.key === 'Escape') {
    closeUserMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
    closeUserMenu()
  }
)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  window.addEventListener('resize', handleResize)
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeyDown)
})
</script>
