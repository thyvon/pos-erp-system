import { defineStore } from 'pinia'
import * as authApi from '@api/auth'

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
      return this.user
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
