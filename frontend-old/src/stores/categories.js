import { defineStore } from 'pinia'
import * as categoriesApi from '@api/categories'

const defaultFilters = () => ({
  search: '',
  parent_id: '',
  page: 1,
  per_page: 15,
})

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    items: [],
    options: [],
    loading: false,
    optionsLoading: false,
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
    async fetchCategories(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await categoriesApi.getCategories({
          search: this.filters.search || undefined,
          parent_id: this.filters.parent_id || undefined,
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
        const response = await categoriesApi.getCategoryOptions()
        this.options = response.data.data || []
        return this.options
      } finally {
        this.optionsLoading = false
      }
    },

    async createCategory(payload) {
      this.saving = true

      try {
        const response = await categoriesApi.createCategory(payload)
        await this.fetchCategories({ page: 1 })
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },

    async updateCategory(id, payload) {
      this.saving = true

      try {
        const response = await categoriesApi.updateCategory(id, payload)
        await this.fetchCategories()
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },

    async deleteCategory(id) {
      this.deleting = true

      try {
        const response = await categoriesApi.deleteCategory(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchCategories({ page: nextPage })
        await this.fetchOptions()
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
