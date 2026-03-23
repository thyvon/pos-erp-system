import { defineStore } from 'pinia'
import * as usersApi from '@api/users'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    deleting: false,
    optionsLoading: false,
    filters: defaultFilters(),
    accessOptions: {
      roles: [],
      permissions: [],
      branches: [],
    },
    pagination: {
      total: 0,
      current_page: 1,
      last_page: 1,
      per_page: 15,
    },
  }),
  actions: {
    async fetchAccessOptions() {
      this.optionsLoading = true

      try {
        const response = await usersApi.getUserAccessOptions()
        this.accessOptions = response.data.data
        return response.data
      } finally {
        this.optionsLoading = false
      }
    },
    async fetchUsers(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await usersApi.getUsers({
          search: this.filters.search || undefined,
          per_page: this.filters.per_page,
          page: this.filters.page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta

        return response.data
      } finally {
        this.loading = false
      }
    },
    async createUser(payload) {
      this.saving = true

      try {
        const response = await usersApi.createUser(payload)
        await this.fetchUsers({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateUser(id, payload) {
      this.saving = true

      try {
        const response = await usersApi.updateUser(id, payload)
        await this.fetchUsers()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteUser(id) {
      this.deleting = true

      try {
        const response = await usersApi.deleteUser(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchUsers({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
