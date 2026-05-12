import { defineStore } from 'pinia'
import * as customersApi from '@api/customers'

const defaultFilters = () => ({
  search: '',
  status: '',
  customer_group_id: '',
  page: 1,
  per_page: 15,
})

export const useCustomersStore = defineStore('customers', {
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
    async fetchCustomers(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await customersApi.getCustomers({
          search: this.filters.search || undefined,
          status: this.filters.status || undefined,
          customer_group_id: this.filters.customer_group_id || undefined,
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
    async createCustomer(payload) {
      this.saving = true

      try {
        const response = await customersApi.createCustomer(payload)
        await this.fetchCustomers({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateCustomer(id, payload) {
      this.saving = true

      try {
        const response = await customersApi.updateCustomer(id, payload)
        await this.fetchCustomers()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteCustomer(id) {
      this.deleting = true

      try {
        const response = await customersApi.deleteCustomer(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchCustomers({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
