import { defineStore } from 'pinia'
import * as customerGroupsApi from '@api/customerGroups'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useCustomerGroupsStore = defineStore('customerGroups', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    deleting: false,
    filters: defaultFilters(),
    pagination: {
      total: 0,
      current_page: 1,
      last_page: 1,
      per_page: 15,
    },
  }),
  actions: {
    async fetchCustomerGroups(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await customerGroupsApi.getCustomerGroups({
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
    async createCustomerGroup(payload) {
      this.saving = true

      try {
        const response = await customerGroupsApi.createCustomerGroup(payload)
        await this.fetchCustomerGroups({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateCustomerGroup(id, payload) {
      this.saving = true

      try {
        const response = await customerGroupsApi.updateCustomerGroup(id, payload)
        await this.fetchCustomerGroups()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteCustomerGroup(id) {
      this.deleting = true

      try {
        const response = await customerGroupsApi.deleteCustomerGroup(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchCustomerGroups({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
