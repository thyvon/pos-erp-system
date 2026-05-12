import { defineStore } from 'pinia'
import * as accountingApi from '@api/accounting'

const defaultPagination = () => ({
  total: 0,
  current_page: 1,
  last_page: 1,
  per_page: 15,
})

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useChartOfAccountsStore = defineStore('accounting-chart-of-accounts', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    deleting: false,
    filters: { ...defaultFilters(), type: '', status: '' },
    pagination: defaultPagination(),
    summary: { total_accounts: 0, postable_accounts: 0, system_accounts: 0, active_accounts: 0 },
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await accountingApi.getChartOfAccounts({
          search: this.filters.search || undefined,
          type: this.filters.type || undefined,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        this.summary = response.data.summary || this.summary
        return response.data
      } finally {
        this.loading = false
      }
    },
    async createItem(payload) {
      this.saving = true

      try {
        const response = await accountingApi.createChartOfAccount(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateItem(id, payload) {
      this.saving = true

      try {
        const response = await accountingApi.updateChartOfAccount(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteItem(id) {
      this.deleting = true

      try {
        const response = await accountingApi.deleteChartOfAccount(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchItems({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})

export const useJournalsStore = defineStore('accounting-journals', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    filters: { ...defaultFilters(), status: '', journal_type: '' },
    pagination: defaultPagination(),
    summary: { total_journals: 0, posted_journals: 0, reversed_journals: 0, posted_volume: 0 },
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await accountingApi.getJournals({
          search: this.filters.search || undefined,
          status: this.filters.status || undefined,
          journal_type: this.filters.journal_type || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        this.summary = response.data.summary || this.summary
        return response.data
      } finally {
        this.loading = false
      }
    },
    async createItem(payload) {
      this.saving = true

      try {
        const response = await accountingApi.createJournal(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async reverseItem(id, payload) {
      this.saving = true

      try {
        const response = await accountingApi.reverseJournal(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})

export const usePaymentAccountsStore = defineStore('accounting-payment-accounts', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    deleting: false,
    filters: { ...defaultFilters(), type: '', status: '' },
    pagination: defaultPagination(),
    summary: { total_accounts: 0, active_accounts: 0, bank_accounts: 0, linked_accounts: 0 },
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await accountingApi.getPaymentAccounts({
          search: this.filters.search || undefined,
          type: this.filters.type || undefined,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        this.summary = response.data.summary || this.summary
        return response.data
      } finally {
        this.loading = false
      }
    },
    async createItem(payload) {
      this.saving = true

      try {
        const response = await accountingApi.createPaymentAccount(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateItem(id, payload) {
      this.saving = true

      try {
        const response = await accountingApi.updatePaymentAccount(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteItem(id) {
      this.deleting = true

      try {
        const response = await accountingApi.deletePaymentAccount(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchItems({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
    async transfer(payload) {
      this.saving = true

      try {
        const response = await accountingApi.transferPaymentAccounts(payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})

export const useFiscalYearsStore = defineStore('accounting-fiscal-years', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    deleting: false,
    filters: { ...defaultFilters(), status: '' },
    pagination: defaultPagination(),
    summary: { total_years: 0, active_years: 0, closed_years: 0 },
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await accountingApi.getFiscalYears({
          search: this.filters.search || undefined,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        this.summary = response.data.summary || this.summary
        return response.data
      } finally {
        this.loading = false
      }
    },
    async createItem(payload) {
      this.saving = true

      try {
        const response = await accountingApi.createFiscalYear(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateItem(id, payload) {
      this.saving = true

      try {
        const response = await accountingApi.updateFiscalYear(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteItem(id) {
      this.deleting = true

      try {
        const response = await accountingApi.deleteFiscalYear(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchItems({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
