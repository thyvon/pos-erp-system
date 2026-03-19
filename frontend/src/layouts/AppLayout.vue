<template>
  <div class="erp-shell min-h-screen">
    <div
      class="min-h-screen transition-[grid-template-columns] duration-300 lg:grid"
      :class="sidebarCollapsed ? 'lg:grid-cols-[6rem_minmax(0,1fr)]' : 'lg:grid-cols-[19rem_minmax(0,1fr)]'"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        @click="sidebarOpen = false"
      ></div>

      <aside
        class="fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-white/10 bg-slate-950/95 text-slate-200 transition-all duration-300 lg:!static lg:z-auto lg:h-screen lg:sticky lg:top-0 lg:translate-x-0"
        :style="desktopSidebarStyle"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <RouterLink to="/dashboard" class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-lg font-bold text-slate-950 shadow-soft">
              P
            </div>
            <div v-if="!sidebarCollapsed" class="min-w-0">
              <div class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                POS ERP
              </div>
              <div class="text-xs text-slate-400">Custom Vue workspace</div>
            </div>
          </RouterLink>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="erp-sidebar-collapse hidden lg:inline-flex"
              @click="toggleSidebarCollapsed"
            >
              <i class="fa-solid" :class="sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'"></i>
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-300 lg:hidden"
              @click="sidebarOpen = false"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div ref="sidebarScrollRef" class="flex-1 overflow-y-auto overscroll-y-contain px-4 py-6">
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
                  <div class="mt-1 text-sm text-slate-400">
                    {{ userDisplayName }}
                  </div>
                </div>
              </div>
              <span class="erp-nav-badge bg-cyan-400/15 text-cyan-200">Live API</span>
            </div>

            <p class="mt-3 text-sm leading-6 text-slate-400">
              Standalone Vue frontend consuming the Laravel backend with tenant-aware ERP modules.
            </p>

            <div class="mt-5 grid grid-cols-2 gap-3">
              <div class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Role</div>
                <div class="mt-1 text-sm font-medium text-white">
                  {{ auth.user?.roles?.[0] || 'Admin' }}
                </div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Modules</div>
                <div class="mt-1 text-sm font-medium text-white">Foundation</div>
              </div>
            </div>
          </div>

          <div class="mt-8 space-y-7">
            <section v-for="group in navGroups" :key="group.label">
              <div v-if="!sidebarCollapsed" class="erp-sidebar-section-title">
                {{ group.label }}
              </div>
              <div class="mt-3 space-y-1.5">
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
            class="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/0 p-4"
          >
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Next Build Target
            </div>
            <div class="mt-2 text-base font-semibold text-white">Branches + Warehouses</div>
            <p class="mt-2 text-sm leading-6 text-slate-400">
              The shell is ready. The next pages should inherit this structure instead of redefining page layout.
            </p>
          </div>
        </div>
      </aside>

      <div class="erp-main-wrap min-w-0 overflow-x-hidden">
        <header class="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
          <div class="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
            <div class="flex items-center gap-3">
              <button type="button" class="erp-topbar-button lg:hidden" @click="sidebarOpen = true">
                <i class="fa-solid fa-bars"></i>
                <span>Menu</span>
              </button>
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  ERP Workspace
                </div>
                <div class="text-base font-semibold text-slate-950 dark:text-white">
                  {{ title }}
                </div>
                <ol class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
              <div class="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-soft dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 xl:flex">
                <div class="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                <span>Backend connected</span>
              </div>
              <button type="button" class="erp-topbar-button" @click="toggleTheme">
                <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
                <span class="hidden sm:inline">{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
              </button>
              <div class="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80 lg:flex">
                <div class="erp-user-avatar erp-user-avatar-topbar">
                  <img
                    v-if="userAvatarUrl"
                    :src="userAvatarUrl"
                    :alt="userDisplayName"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ userInitials }}</span>
                </div>
                <div class="text-right">
                  <div class="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Signed in</div>
                  <div class="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {{ userDisplayName }}
                  </div>
                </div>
              </div>
              <button type="button" class="erp-topbar-button" @click="handleLogout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span class="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main class="px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
          <div class="mx-auto w-full max-w-[1600px] pb-28">
            <slot />
          </div>
        </main>

        <footer
          class="fixed bottom-0 right-0 z-20 border-t border-slate-200/70 bg-transparent px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-4 lg:px-6"
          :style="footerDesktopStyle"
        >
          <div class="mx-auto flex w-full max-w-[1600px] flex-col gap-4 rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-3 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/88 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {{ appName }}
              </div>
              <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Standalone ERP workspace connected to the Laravel API backend.
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
const isDark = ref(document.documentElement.classList.contains('dark'))
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

const handleLogout = async () => {
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

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  }
)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  window.addEventListener('resize', handleResize)
  sidebarScrollRef.value?.addEventListener('wheel', handleSidebarWheel, { passive: false })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  sidebarScrollRef.value?.removeEventListener('wheel', handleSidebarWheel)
})
</script>