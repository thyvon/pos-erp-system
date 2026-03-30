<template>
  <div class="erp-shell min-h-screen">
    <div class="relative min-h-screen">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-slate-950/28 backdrop-blur-md lg:hidden"
        @click="sidebarOpen = false"
      ></div>

      <div
        v-if="isDesktop"
        class="erp-sidebar-brand fixed left-0 top-0 z-30 flex h-[72px] items-center px-4"
        :style="desktopBrandStyle"
      >
        <RouterLink to="/dashboard" class="flex min-w-0 items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-[5px] bg-[linear-gradient(135deg,#ecf5ff,#8cc7ff_55%,#4d84ff)] text-lg font-bold text-slate-950 shadow-[0_18px_30px_rgba(77,132,255,0.28)]">
            E
          </div>
          <div v-if="!sidebarCollapsed" class="min-w-0">
            <div class="erp-sidebar-brand-kicker text-[11px] font-semibold uppercase tracking-[0.28em]">
              POS ERP
            </div>
            <div class="erp-sidebar-brand-title mt-1 truncate text-sm font-medium">Liquid Workspace</div>
          </div>
        </RouterLink>
      </div>

      <header v-if="isDesktop" class="fixed top-0 z-30" :style="desktopHeaderStyle">
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
            <div class="erp-glass-band hidden items-center gap-2.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 xl:flex">
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

      <aside
        class="erp-sidebar-shell fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[88vw] flex-col overflow-hidden rounded-r-[5px] transition-all duration-300 lg:bottom-0 lg:top-[72px] lg:z-20 lg:max-w-none lg:rounded-none lg:translate-x-0"
        :style="desktopSidebarStyle"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="erp-sidebar-shell-bg absolute inset-0 rounded-r-[5px] lg:rounded-none"></div>
        <div class="erp-sidebar-shell-border absolute inset-0 rounded-r-[5px] lg:rounded-none"></div>
        <div class="erp-sidebar-shell-glow absolute inset-x-0 top-0 h-28 rounded-tr-[5px] lg:rounded-none"></div>

        <div v-if="!isDesktop" class="erp-sidebar-mobile-head relative flex min-h-[88px] items-center justify-between px-4 py-4">
          <RouterLink to="/dashboard" class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-[5px] bg-[linear-gradient(135deg,#ecf5ff,#8cc7ff_55%,#4d84ff)] text-lg font-bold text-slate-950 shadow-[0_18px_30px_rgba(77,132,255,0.28)]">
              E
            </div>
            <div v-if="!sidebarCollapsed" class="min-w-0">
              <div class="erp-sidebar-brand-kicker text-[11px] font-semibold uppercase tracking-[0.28em]">
                POS ERP
              </div>
              <div class="erp-sidebar-brand-title mt-1 text-sm font-medium">Liquid Workspace</div>
            </div>
          </RouterLink>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="erp-sidebar-mobile-close rounded-[5px] px-2.5 py-1.5 text-sm lg:hidden"
              @click="sidebarOpen = false"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div
          ref="sidebarScrollRef"
          class="relative flex-1 overscroll-y-contain px-3 py-4 erp-sidebar-scroll"
          :class="sidebarScrollClasses"
          @mouseenter="sidebarHovered = true"
          @mouseleave="sidebarHovered = false"
        >
          <div class="mt-6 space-y-6">
            <section v-for="group in navGroups" :key="group.label">
              <div v-if="!sidebarCollapsed" class="erp-sidebar-section-title">
                {{ group.label }}
              </div>
              <div class="mt-2.5 space-y-1.5">
                <div v-for="item in group.items" :key="item.key || item.label" class="space-y-1.5">
                  <button
                    v-if="item.children?.length"
                    type="button"
                    class="erp-sidebar-link w-full"
                    :class="isItemActive(item) ? 'erp-sidebar-link-active' : ''"
                    :title="sidebarCollapsed ? item.label : undefined"
                    @click="toggleNavItem(item.key)"
                  >
                    <div class="flex items-center gap-3" :class="sidebarCollapsed ? 'w-full justify-center' : ''">
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

                  <div
                    v-if="item.children?.length && !sidebarCollapsed && isNavItemExpanded(item)"
                    class="ml-5 space-y-1 border-l border-slate-200/70 pl-3 dark:border-slate-800/80"
                  >
                    <RouterLink
                      v-for="child in item.children"
                      :key="child.key || child.label"
                      :to="child.to"
                      class="erp-sidebar-link"
                      :class="isItemActive(child) ? 'erp-sidebar-link-active' : ''"
                      @click="sidebarOpen = false"
                    >
                      <div class="flex min-w-0 items-center gap-3">
                        <span class="erp-nav-icon">
                          <i :class="child.icon"></i>
                        </span>
                        <div class="min-w-0">
                          <div class="text-sm font-medium">{{ child.label }}</div>
                        </div>
                      </div>
                      <span class="erp-nav-badge" :class="child.statusClass">
                        {{ child.status }}
                      </span>
                    </RouterLink>
                  </div>

                  <component
                    v-if="!item.children?.length"
                    :is="item.to ? RouterLink : 'a'"
                    :to="item.to"
                    :href="item.to ? undefined : 'javascript:void(0)'"
                    class="erp-sidebar-link"
                    :class="isItemActive(item) ? 'erp-sidebar-link-active' : ''"
                    :title="sidebarCollapsed ? item.label : undefined"
                    @click="sidebarOpen = false"
                  >
                    <div class="flex items-center gap-3" :class="sidebarCollapsed ? 'w-full justify-center' : ''">
                      <span class="erp-nav-icon">
                        <i :class="item.icon"></i>
                      </span>
                      <div v-if="!sidebarCollapsed">
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

          <div
            v-if="!sidebarCollapsed"
            class="erp-sidebar-callout mt-6 rounded-[5px] p-3"
          >
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

      <div class="erp-main-wrap min-w-0 overflow-x-hidden" :style="mainWrapStyle">
        <header v-if="!isDesktop" class="sticky top-0 z-30">
          <div class="erp-panel-float flex min-h-[72px] w-full items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 py-2.5 lg:px-6">
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
              <div class="erp-glass-band hidden items-center gap-2.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 xl:flex">
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
          <div class="w-full px-4 py-4 pb-40 lg:px-6 lg:py-5 lg:pb-36">
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
                {{ t('layout.footerDescription') }}
              </div>
            </div>
            <div class="flex flex-col items-start gap-1 text-left sm:items-end">
              <div class="font-medium text-slate-700 dark:text-slate-200">{{ today }}</div>
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
import { applyLocale, getIntlLocale } from '@/i18n'
import NotificationBell from '@components/ui/NotificationBell.vue'

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
const { t, locale } = useI18n()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('erp_sidebar_collapsed') === 'true')
const sidebarHovered = ref(false)
const sidebarScrollRef = ref(null)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
const isDesktop = computed(() => viewportWidth.value >= 1024)
const isDark = ref(document.documentElement.classList.contains('dark'))
const userMenuOpen = ref(false)
const userMenuRef = ref(null)
const expandedNavItems = ref({})
const themeKey = 'erp_theme'
const appName = import.meta.env.VITE_APP_NAME || 'ERP System'
const currentYear = new Date().getFullYear()
const today = computed(() =>
  new Date().toLocaleDateString(getIntlLocale(locale.value), {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
)

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
const isSuperAdmin = computed(() => auth.isSuperAdmin)

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

const isNavItemExpanded = (item) => {
  if (!item.children?.length) {
    return false
  }

  return isItemActive(item) || Boolean(expandedNavItems.value[item.key])
}

const desktopSidebarStyle = computed(() => ({
  width: sidebarCollapsed.value ? '6rem' : '19rem',
}))

const desktopBrandStyle = computed(() => ({
  width: sidebarCollapsed.value ? '6rem' : '19rem',
}))

const desktopHeaderStyle = computed(() => ({
  left: viewportWidth.value >= 1024 ? (sidebarCollapsed.value ? '6rem' : '19rem') : '0',
  right: '0',
}))

const mainWrapStyle = computed(() => ({
  marginLeft: viewportWidth.value >= 1024 ? (sidebarCollapsed.value ? '6rem' : '19rem') : '0',
  paddingTop: viewportWidth.value >= 1024 ? '72px' : '0',
  paddingBottom: viewportWidth.value >= 1024 ? '6rem' : '7rem',
}))

const sidebarScrollClasses = computed(() => {
  if (!isDesktop.value) {
    return 'overflow-y-auto'
  }

  return sidebarHovered.value ? 'overflow-y-auto' : 'overflow-y-hidden'
})

const footerDesktopStyle = computed(() => ({
  left:
    viewportWidth.value >= 1024
      ? sidebarCollapsed.value
        ? '6rem'
        : '19rem'
      : '0',
}))

const currentLocaleLabel = computed(() => (locale.value === 'km' ? 'KM' : 'EN'))

const toggleNavItem = (key) => {
  if (!key) {
    return
  }

  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    localStorage.setItem('erp_sidebar_collapsed', 'false')
  }

  expandedNavItems.value = {
    ...expandedNavItems.value,
    [key]: !expandedNavItems.value[key],
  }
}

const navGroups = computed(() => {
  const base = [
    {
      label: t('layout.groups.overview'),
      items: [
        {
          label: t('layout.nav.dashboard.label'),
          description: t('layout.nav.dashboard.description'),
          short: 'DB',
          to: '/dashboard',
          status: t('status.live'),
          statusClass: 'bg-emerald-400/15 text-emerald-200',
          icon: 'fa-solid fa-gauge-high',
        },
      ],
    },
  ]

  if (isSuperAdmin.value) {
    base.push({
      label: t('layout.groups.platform'),
      items: [
        {
          label: t('layout.nav.businesses.label'),
          description: t('layout.nav.businesses.description'),
          short: 'BS',
          to: '/admin/businesses',
          permission: 'businesses.index',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-briefcase',
        },
      ],
    })
  } else {
    base.push({
      label: t('layout.groups.userManagement'),
      items: [
        {
          label: t('layout.nav.users.label'),
          description: t('layout.nav.users.description'),
          short: 'US',
          to: '/users',
          permission: 'users.index',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-users',
        },
        {
          label: t('layout.nav.roles.label'),
          description: t('layout.nav.roles.description'),
          short: 'RL',
          to: '/roles',
          permission: 'roles.index',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-user-shield',
        },
      ],
    })

    base.push({
      label: t('layout.groups.foundation'),
      items: [
        {
          label: t('layout.nav.branches.label'),
          description: t('layout.nav.branches.description'),
          short: 'BR',
          to: '/branches',
          permission: 'branches.index',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-code-branch',
        },
        {
          label: t('layout.nav.warehouses.label'),
          description: t('layout.nav.warehouses.description'),
          short: 'WH',
          to: '/warehouses',
          permission: 'warehouses.index',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-warehouse',
        },
        {
          label: t('layout.nav.settings.label'),
          description: t('layout.nav.settings.description'),
          short: 'ST',
          to: '/settings',
          permissionAny: ['settings.index', 'businesses.index'],
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-gear',
        },
        {
          key: 'contacts',
          label: t('layout.nav.contacts.label'),
          description: t('layout.nav.contacts.description'),
          short: 'CT',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-address-card',
          children: [
            {
              key: 'customer-groups',
              label: t('layout.nav.customerGroups.label'),
              description: t('layout.nav.customerGroups.description'),
              short: 'CG',
              to: '/customer-groups',
              permission: 'customer_groups.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-user-tag',
            },
            {
              key: 'customers',
              label: t('layout.nav.customers.label'),
              description: t('layout.nav.customers.description'),
              short: 'CU',
              to: '/customers',
              permission: 'customers.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-address-book',
            },
            {
              key: 'suppliers',
              label: t('layout.nav.suppliers.label'),
              description: t('layout.nav.suppliers.description'),
              short: 'SP',
              to: '/suppliers',
              permission: 'suppliers.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-truck-field',
            },
          ],
        },
        {
          label: t('layout.nav.taxRates.label'),
          description: t('layout.nav.taxRates.description'),
          short: 'TX',
          to: '/tax-rates',
          permission: 'tax_rates.index',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-percent',
        },
        {
          label: t('layout.nav.taxGroups.label'),
          description: t('layout.nav.taxGroups.description'),
          short: 'TG',
          to: '/tax-groups',
          permission: 'tax_groups.index',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-layer-group',
        },
        {
          label: t('layout.nav.customFields.label'),
          description: t('layout.nav.customFields.description'),
          short: 'CF',
          to: '/custom-fields',
          permission: 'custom_fields.index',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-sliders',
        },
      ],
    })

    base.push({
      label: t('layout.groups.catalog'),
      items: [
        {
          key: 'catalog',
          label: t('layout.nav.catalog.label'),
          description: t('layout.nav.catalog.description'),
          short: 'CA',
          status: t('status.ready'),
          statusClass: 'bg-cyan-400/15 text-cyan-200',
          icon: 'fa-solid fa-boxes-stacked',
          children: [
            {
              key: 'products',
              label: t('layout.nav.products.label'),
              description: t('layout.nav.products.description'),
              short: 'PR',
              to: '/catalog/products',
              permission: 'products.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-box-open',
            },
            {
              key: 'categories',
              label: t('layout.nav.categories.label'),
              description: t('layout.nav.categories.description'),
              short: 'CT',
              to: '/catalog/categories',
              permission: 'categories.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-sitemap',
            },
            {
              key: 'brands',
              label: t('layout.nav.brands.label'),
              description: t('layout.nav.brands.description'),
              short: 'BR',
              to: '/catalog/brands',
              permission: 'brands.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-award',
            },
            {
              key: 'units',
              label: t('layout.nav.units.label'),
              description: t('layout.nav.units.description'),
              short: 'UN',
              to: '/catalog/units',
              permission: 'units.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-ruler-combined',
            },
            {
              key: 'variation-templates',
              label: t('layout.nav.variationTemplates.label'),
              description: t('layout.nav.variationTemplates.description'),
              short: 'VT',
              to: '/catalog/variation-templates',
              permission: 'variation_templates.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-swatchbook',
            },
            {
              key: 'rack-locations',
              label: t('layout.nav.rackLocations.label'),
              description: t('layout.nav.rackLocations.description'),
              short: 'RL',
              to: '/catalog/rack-locations',
              permission: 'rack_locations.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-warehouse',
            },
            {
              key: 'price-groups',
              label: t('layout.nav.priceGroups.label'),
              description: t('layout.nav.priceGroups.description'),
              short: 'PG',
              to: '/catalog/price-groups',
              permission: 'price_groups.index',
              status: t('status.ready'),
              statusClass: 'bg-cyan-400/15 text-cyan-200',
              icon: 'fa-solid fa-tags',
            },
          ],
        },
      ],
    })
  }

  base.push({
    label: t('layout.groups.roadmap'),
    items: [
      {
        label: t('layout.nav.inventory.label'),
        description: t('layout.nav.inventory.description'),
        short: 'IV',
        status: t('status.planned'),
        statusClass: 'bg-slate-400/15 text-slate-300',
        icon: 'fa-solid fa-layer-group',
      },
      {
        label: t('layout.nav.sales.label'),
        description: t('layout.nav.sales.description'),
        short: 'SL',
        status: t('status.planned'),
        statusClass: 'bg-slate-400/15 text-slate-300',
        icon: 'fa-solid fa-cash-register',
      },
    ],
  })

  return base
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => ({
          ...item,
          children: item.children?.filter(
            (child) =>
              (!child.permission || auth.can(child.permission)) &&
              (!child.permissionAny || auth.canAny(child.permissionAny))
          ),
        }))
        .filter(
          (item) =>
            ((!item.permission || auth.can(item.permission)) &&
              (!item.permissionAny || auth.canAny(item.permissionAny))) ||
            (item.children && item.children.length > 0)
        ),
    }))
    .filter((group) => group.items.length > 0)
})

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
    sidebarHovered.value = false
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
