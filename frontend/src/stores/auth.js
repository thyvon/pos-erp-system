import { defineStore } from 'pinia'
import * as authApi from '@api/auth'
import { applyLocale, resolveLocalePreference } from '@/i18n'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
    token: localStorage.getItem(TOKEN_KEY),
    loading: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    isSuperAdmin: (state) => Boolean(state.user?.roles?.includes('super_admin')),
    permissions: (state) => state.user?.permissions || [],
    can: (state) => (permission) => {
      if (state.user?.roles?.includes('super_admin')) {
        return true
      }

      return Boolean(state.user?.permissions?.includes(permission))
    },
    canAny: (state) => (permissions) => {
      if (state.user?.roles?.includes('super_admin')) {
        return true
      }

      return permissions.some((permission) => state.user?.permissions?.includes(permission))
    },

    /** super_admin and admin: full business branch visibility; use /branches for lists. */
    isBranchScopeBypassed: (state) => {
      const roles = state.user?.roles || []
      return ['super_admin', 'admin'].some((r) => roles.includes(r))
    },

    /**
     * Branches this user may scope to in the UI. Empty for bypass roles (load all via API).
     * @returns {Array<{ id: string, name: string }>}
     */
    allowedBranches: (state) => {
      if (!state.user) {
        return []
      }

      if (['super_admin', 'admin'].some((r) => state.user.roles?.includes(r))) {
        return []
      }

      if (Array.isArray(state.user.allowed_branches)) {
        return state.user.allowed_branches
      }

      return (state.user.branches || []).map((b) => ({ id: b.id, name: b.name }))
    },

    /** Branch-scoped role with zero assigned branches — block app until admin assigns access (v10 Phase 3). */
    needsBranchAccessBlock: (state) => {
      if (!state.token || !state.user) {
        return false
      }

      if (['super_admin', 'admin'].some((r) => state.user.roles?.includes(r))) {
        return false
      }

      if (Array.isArray(state.user.allowed_branches)) {
        return state.user.allowed_branches.length === 0
      }

      return !(state.user.branches && state.user.branches.length)
    },

    hasRole: (state) => (role) => {
      const roles = state.user?.roles || []

      if (Array.isArray(role)) {
        return role.some((r) => roles.includes(r))
      }

      return roles.includes(role)
    },
  },
  actions: {
    persist() {
      if (this.token) {
        localStorage.setItem(TOKEN_KEY, this.token)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }

      if (this.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      } else {
        localStorage.removeItem(USER_KEY)
      }
    },
    clearAuth() {
      this.token = null
      this.user = null
      this.persist()
    },
    async login(credentials) {
      this.loading = true

      try {
        const response = await authApi.login(credentials)
        this.token = response.data.data.token
        this.user = response.data.data.user
        this.persist()
        applyLocale(resolveLocalePreference(this.user))
        return response.data
      } finally {
        this.loading = false
      }
    },
    async fetchMe() {
      if (!this.token) {
        return null
      }

      const response = await authApi.me()
      this.user = response.data.data
      this.persist()
      applyLocale(resolveLocalePreference(this.user))
      return this.user
    },
    async updateLocalePreference(locale) {
      const response = await authApi.updatePreferences({ locale })
      this.user = response.data.data
      this.persist()
      applyLocale(resolveLocalePreference(this.user))
      return response.data
    },
    async logout() {
      try {
        if (this.token) {
          await authApi.logout()
        }
      } catch {
        // Ignore logout API failures and clear local state anyway.
      } finally {
        this.clearAuth()
      }
    },
  },
})
