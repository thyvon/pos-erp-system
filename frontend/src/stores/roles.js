import { defineStore } from 'pinia'
import * as rolesApi from '@api/roles'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useRolesStore = defineStore('roles', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    deleting: false,
    optionsLoading: false,
    filters: defaultFilters(),
    options: {
      permissions: [],
    },
    pagination: {
      total: 0,
      current_page: 1,
      last_page: 1,
      per_page: 15,
    },
  }),
  actions: {
    async fetchRoles(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await rolesApi.getRoles({
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
    async fetchOptions() {
      this.optionsLoading = true

      try {
        const response = await rolesApi.getRoleOptions()
        this.options = response.data.data
        return response.data
      } finally {
        this.optionsLoading = false
      }
    },
    async createRole(payload) {
      this.saving = true

      try {
        const response = await rolesApi.createRole(payload)
        await this.fetchRoles({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateRole(id, payload) {
      this.saving = true

      try {
        const response = await rolesApi.updateRole(id, payload)
        await this.fetchRoles()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteRole(id) {
      this.deleting = true

      try {
        const response = await rolesApi.deleteRole(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchRoles({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
