import { defineStore } from 'pinia'
import * as customFieldsApi from '@api/customFields'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useCustomFieldsStore = defineStore('customFields', {
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
    async fetchCustomFields(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await customFieldsApi.getCustomFields({
          search: this.filters.search || undefined,
          module: this.filters.module || undefined,
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
    async createCustomField(payload) {
      this.saving = true

      try {
        const response = await customFieldsApi.createCustomField(payload)
        await this.fetchCustomFields({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateCustomField(id, payload) {
      this.saving = true

      try {
        const response = await customFieldsApi.updateCustomField(id, payload)
        await this.fetchCustomFields()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteCustomField(id) {
      this.deleting = true

      try {
        const response = await customFieldsApi.deleteCustomField(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchCustomFields({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
