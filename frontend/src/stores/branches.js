import { defineStore } from 'pinia'
import * as branchesApi from '@api/branches'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useBranchesStore = defineStore('branches', {
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
    async fetchBranches(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await branchesApi.getBranches({
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
    async createBranch(payload) {
      this.saving = true

      try {
        const response = await branchesApi.createBranch(payload)
        await this.fetchBranches({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateBranch(id, payload) {
      this.saving = true

      try {
        const response = await branchesApi.updateBranch(id, payload)
        await this.fetchBranches()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteBranch(id) {
      this.deleting = true

      try {
        const response = await branchesApi.deleteBranch(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchBranches({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
