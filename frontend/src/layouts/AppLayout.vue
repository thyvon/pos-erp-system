<template>
  <div class="erp-shell min-h-screen">
    <div class="erp-glass-orb left-[-7rem] top-[6rem] h-56 w-56 bg-sky-300/30"></div>
    <div class="erp-glass-orb right-[8%] top-[3.5rem] h-64 w-64 bg-orange-200/30" style="animation-delay: -4s"></div>
    <div class="erp-glass-orb bottom-[7rem] right-[-5rem] h-72 w-72 bg-blue-300/20" style="animation-delay: -8s"></div>

    <div
      class="relative min-h-screen transition-[grid-template-columns] duration-300 lg:grid lg:grid-rows-[72px_minmax(0,1fr)]"
      :class="sidebarCollapsed ? 'lg:grid-cols-[6rem_minmax(0,1fr)]' : 'lg:grid-cols-[19rem_minmax(0,1fr)]'"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-slate-950/28 backdrop-blur-md lg:hidden"
        @click="sidebarOpen = false"
      ></div>

      <div
        v-if="isDesktop"
        class="relative z-30 flex items-center border-b border-r border-white/10 bg-[linear-gradient(180deg,rgba(5,16,31,0.96),rgba(8,20,37,0.92))] px-4"
      >
        <RouterLink to="/dashboard" class="flex min-w-0 items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-[5px] bg-[linear-gradient(135deg,#ecf5ff,#8cc7ff_55%,#4d84ff)] text-lg font-bold text-slate-950 shadow-[0_18px_30px_rgba(77,132,255,0.28)]">
            E
          </div>
          <div v-if="!sidebarCollapsed" class="min-w-0">
            <div class="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              POS ERP
            </div>
            <div class="mt-1 truncate text-sm font-medium text-white/90">Liquid Workspace</div>
          </div>
        </RouterLink>
      </div>

      <header v-if="isDesktop" class="sticky top-0 z-30">
        <div class="erp-panel-float flex min-h-[72px] w-full items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 py-2.5 lg:px-6">
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
            <ol class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
            <div class="erp-glass-band hidden items-center gap-2.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 xl:flex">
              <div class="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
              <span>Backend connected</span>
            </div>
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

      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[88vw] flex-col overflow-hidden rounded-r-[5px] text-slate-200 transition-all duration-300 lg:!static lg:z-auto lg:h-[calc(100vh-72px)] lg:max-w-none lg:rounded-none lg:sticky lg:top-[72px] lg:translate-x-0"
        :style="desktopSidebarStyle"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="absolute inset-0 rounded-r-[5px] bg-[linear-gradient(180deg,rgba(5,16,31,0.9),rgba(8,20,37,0.78))] lg:rounded-none"></div>
        <div class="absolute inset-0 rounded-r-[5px] border border-white/10 lg:rounded-none lg:border-y-0 lg:border-l-0"></div>
        <div class="absolute inset-x-0 top-0 h-28 rounded-tr-[5px] bg-gradient-to-b from-white/10 to-transparent lg:rounded-none"></div>

        <div v-if="!isDesktop" class="relative flex min-h-[88px] items-center justify-between border-b border-white/10 px-4 py-4">
          <RouterLink to="/dashboard" class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-[5px] bg-[linear-gradient(135deg,#ecf5ff,#8cc7ff_55%,#4d84ff)] text-lg font-bold text-slate-950 shadow-[0_18px_30px_rgba(77,132,255,0.28)]">
              E
            </div>
            <div v-if="!sidebarCollapsed" class="min-w-0">
              <div class="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                POS ERP
              </div>
              <div class="mt-1 text-sm font-medium text-white/90">Liquid Workspace</div>
            </div>
          </RouterLink>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-[5px] border border-white/10 px-2.5 py-1.5 text-sm text-slate-300 lg:hidden"
              @click="sidebarOpen = false"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div ref="sidebarScrollRef" class="relative flex-1 overflow-y-auto overscroll-y-contain px-3 py-4">
          <div v-if="!sidebarCollapsed" class="erp-sidebar-panel">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="erp-user-avatar erp-user-avatar-sidebar">
                  <img
                    v-if="userAvatarUrl"
                    :src="userAvatarUrl"
                    :alt="userDisplayName"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ userInitials }}</span>
                </div>
                <div>
                  <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
                    Workspace
                  </div>
                  <div class="mt-2 text-lg font-semibold text-white">
                    {{ auth.user?.business?.name || 'Foundation Build' }}
                  </div>
                  <div class="mt-1 text-sm text-slate-300/80">
                    {{ userDisplayName }}
                  </div>
                </div>
              </div>
              <span class="erp-nav-badge bg-white/10 text-cyan-100">Live API</span>
            </div>

            <p class="mt-3 text-sm leading-6 text-slate-300/78">
              Frosted shell for the ERP control center with tenant-aware modules and API-first flow.
            </p>

            <div class="mt-4 grid grid-cols-2 gap-2.5">
              <div class="rounded-[5px] border border-white/10 bg-white/5 px-2.5 py-2.5">
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400/80">Role</div>
                <div class="mt-1 text-sm font-medium text-white">
                  {{ auth.user?.roles?.[0] || 'Admin' }}
                </div>
              </div>
              <div class="rounded-[5px] border border-white/10 bg-white/5 px-2.5 py-2.5">
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400/80">Modules</div>
                <div class="mt-1 text-sm font-medium text-white">Foundation</div>
              </div>
            </div>
          </div>

          <div class="mt-6 space-y-6">
            <section v-for="group in navGroups" :key="group.label">
              <div v-if="!sidebarCollapsed" class="erp-sidebar-section-title">
                {{ group.label }}
              </div>
              <div class="mt-2.5 space-y-1.5">
                <component
                  :is="item.to ? RouterLink : 'a'"
                  v-for="item in group.items"
                  :key="item.label"
                  :to="item.to"
                  :href="item.to ? undefined : 'javascript:void(0)'"
                  class="erp-sidebar-link"
                  :class="item.to ? isActive(item.to) : ''"
                  :title="sidebarCollapsed ? item.label : undefined"
                  @click="sidebarOpen = false"
                >
                  <div class="flex items-center gap-3" :class="sidebarCollapsed ? 'w-full justify-center' : ''">
                    <span class="erp-nav-icon">
                      <i :class="item.icon"></i>
                    </span>
                    <div v-if="!sidebarCollapsed">
                      <div class="text-sm font-medium">{{ item.label }}</div>
                      <div class="text-xs text-slate-500">{{ item.description }}</div>
                    </div>
                  </div>
                  <span v-if="!sidebarCollapsed" class="erp-nav-badge" :class="item.statusClass">
                    {{ item.status }}
                  </span>
                </component>
              </div>
            </section>
          </div>

          <div
            v-if="!sidebarCollapsed"
            class="mt-6 rounded-[5px] border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-3"
          >
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400/80">
              Next Build Target
            </div>
            <div class="mt-2 text-base font-semibold text-white">Branches + Warehouses</div>
            <p class="mt-2 text-sm leading-6 text-slate-300/76">
              The visual shell is now the default. Each next page should inherit this surface instead of rebuilding layout.
            </p>
          </div>
        </div>
      </aside>

      <div class="erp-main-wrap min-w-0 overflow-x-hidden">
        <header v-if="!isDesktop" class="sticky top-0 z-30">
          <div class="erp-panel-float flex min-h-[72px] w-full items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 py-2.5 lg:px-6">
            <div class="flex items-center gap-3">
              <button type="button" class="erp-topbar-button lg:hidden" @click="sidebarOpen = true">
                <i class="fa-solid fa-bars"></i>
                <span>Menu</span>
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
              <ol class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
              <div class="erp-glass-band hidden items-center gap-2.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 xl:flex">
                <div class="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                <span>Backend connected</span>
              </div>
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

        <main class="px-0 py-0">
          <div class="w-full px-4 py-4 pb-28 lg:px-6 lg:py-5">
            <slot />
          </div>
        </main>

        <footer
          class="fixed bottom-0 right-0 z-20 bg-transparent px-0 py-0 text-sm text-slate-500 dark:text-slate-400"
          :style="footerDesktopStyle"
        >
          <div class="erp-panel-float flex w-full flex-col gap-3 rounded-none border-x-0 border-b-0 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {{ appName }}
              </div>
              <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Frosted ERP workspace connected to the Laravel API backend.
              </div>
            </div>
            <div class="flex flex-col items-start gap-1 text-left sm:items-end">
              <div class="font-medium text-slate-700 dark:text-slate-200">{{ today }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ currentYear }} © All rights reserved</div>
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
import { useAuthStore } from '@stores/auth'

const props = defineProps({
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
const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('erp_sidebar_collapsed') === 'true')
const sidebarScrollRef = ref(null)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
const isDesktop = computed(() => viewportWidth.value >= 1024)
const isDark = ref(document.documentElement.classList.contains('dark'))
const userMenuOpen = ref(false)
const userMenuRef = ref(null)
const themeKey = 'erp_theme'
const appName = import.meta.env.VITE_APP_NAME || 'ERP System'
const currentYear = new Date().getFullYear()
const today = new Date().toLocaleDateString(undefined, {
  weekday: 'short',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const userDisplayName = computed(() => {
  const fullName = auth.user?.full_name?.trim()

  if (fullName) {
    return fullName
  }

  const joined = [auth.user?.first_name, auth.user?.last_name].filter(Boolean).join(' ').trim()

  if (joined) {
    return joined
  }

  return auth.user?.email || 'ERP User'
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

const isActive = (path) =>
  route.path.startsWith(path) ? 'erp-sidebar-link-active' : ''

const desktopSidebarStyle = computed(() => ({
  width: sidebarCollapsed.value ? '6rem' : '19rem',
}))

const footerDesktopStyle = computed(() => ({
  left:
    viewportWidth.value >= 1024
      ? sidebarCollapsed.value
        ? '6rem'
        : '19rem'
      : '0',
}))

const navGroups = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        description: 'KPIs and progress',
        short: 'DB',
        to: '/dashboard',
        status: 'Live',
        statusClass: 'bg-emerald-400/15 text-emerald-200',
        icon: 'fa-solid fa-gauge-high',
      },
    ],
  },
  {
    label: 'Foundation',
    items: [
      {
        label: 'Users',
        description: 'Roles and access',
        short: 'US',
        to: '/users',
        status: 'Ready',
        statusClass: 'bg-cyan-400/15 text-cyan-200',
        icon: 'fa-solid fa-users',
      },
      {
        label: 'Branches',
        description: 'Multi-location setup',
        short: 'BR',
        status: 'Next',
        statusClass: 'bg-amber-400/15 text-amber-200',
        icon: 'fa-solid fa-code-branch',
      },
      {
        label: 'Warehouses',
        description: 'Stock locations',
        short: 'WH',
        status: 'Next',
        statusClass: 'bg-amber-400/15 text-amber-200',
        icon: 'fa-solid fa-warehouse',
      },
      {
        label: 'Settings',
        description: 'System defaults',
        short: 'ST',
        status: 'Soon',
        statusClass: 'bg-slate-400/15 text-slate-300',
        icon: 'fa-solid fa-gear',
      },
    ],
  },
  {
    label: 'Roadmap',
    items: [
      {
        label: 'Catalog',
        description: 'Products and contacts',
        short: 'CG',
        status: 'Planned',
        statusClass: 'bg-slate-400/15 text-slate-300',
        icon: 'fa-solid fa-boxes-stacked',
      },
      {
        label: 'Inventory',
        description: 'Lots and serials',
        short: 'IV',
        status: 'Planned',
        statusClass: 'bg-slate-400/15 text-slate-300',
        icon: 'fa-solid fa-layer-group',
      },
      {
        label: 'Sales & POS',
        description: 'Order flow',
        short: 'SL',
        status: 'Planned',
        statusClass: 'bg-slate-400/15 text-slate-300',
        icon: 'fa-solid fa-cash-register',
      },
    ],
  },
]

const toggleTheme = () => {
  const root = document.documentElement
  const nextDark = !isDark.value
  root.classList.toggle('dark', nextDark)
  isDark.value = nextDark
  localStorage.setItem(themeKey, nextDark ? 'dark' : 'light')
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

const handleSidebarWheel = (event) => {
  const element = sidebarScrollRef.value

  if (!element || element.scrollHeight <= element.clientHeight) {
    return
  }

  event.preventDefault()
  element.scrollTop += event.deltaY
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
  sidebarScrollRef.value?.addEventListener('wheel', handleSidebarWheel, { passive: false })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeyDown)
  sidebarScrollRef.value?.removeEventListener('wheel', handleSidebarWheel)
})
</script>
