import { defineStore } from 'pinia'
import * as salesApi from '@api/sales'

const defaultPagination = () => ({
  total: 0,
  current_page: 1,
  last_page: 1,
  per_page: 15,
})

const defaultSalesFilters = () => ({
  search: '',
  status: '',
  type: '',
  branch_id: '',
  warehouse_id: '',
  customer_id: '',
  date_from: '',
  date_to: '',
  page: 1,
  per_page: 15,
})

const defaultRegisterFilters = () => ({
  search: '',
  branch_id: '',
  status: '',
  page: 1,
  per_page: 15,
})

export const useSalesStore = defineStore('sales-documents', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    filters: defaultSalesFilters(),
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await salesApi.getSales({
          search: this.filters.search || undefined,
          status: this.filters.status || undefined,
          type: this.filters.type || undefined,
          branch_id: this.filters.branch_id || undefined,
          warehouse_id: this.filters.warehouse_id || undefined,
          customer_id: this.filters.customer_id || undefined,
          date_from: this.filters.date_from || undefined,
          date_to: this.filters.date_to || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        return response.data
      } finally {
        this.loading = false
      }
    },
    async createItem(payload) {
      this.saving = true

      try {
        const response = await salesApi.createSale(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async confirmItem(id) {
      this.saving = true

      try {
        const response = await salesApi.confirmSale(id)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async completeItem(id) {
      this.saving = true

      try {
        const response = await salesApi.completeSale(id)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async cancelItem(id, payload = {}) {
      this.saving = true

      try {
        const response = await salesApi.cancelSale(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async recordPayment(id, payload) {
      this.saving = true

      try {
        const response = await salesApi.recordSalePayment(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async recordReturn(id, payload) {
      this.saving = true

      try {
        const response = await salesApi.recordSaleReturn(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})

export const useQuotationsStore = defineStore('sales-quotations', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    filters: { ...defaultSalesFilters(), type: 'quotation' },
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await salesApi.getQuotations({
          search: this.filters.search || undefined,
          status: this.filters.status || undefined,
          branch_id: this.filters.branch_id || undefined,
          warehouse_id: this.filters.warehouse_id || undefined,
          customer_id: this.filters.customer_id || undefined,
          date_from: this.filters.date_from || undefined,
          date_to: this.filters.date_to || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        return response.data
      } finally {
        this.loading = false
      }
    },
    async createItem(payload) {
      this.saving = true

      try {
        const response = await salesApi.createQuotation(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async convertItem(id, payload) {
      this.saving = true

      try {
        const response = await salesApi.convertQuotation(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async cancelItem(id, payload = {}) {
      this.saving = true

      try {
        const response = await salesApi.cancelQuotation(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})

export const useCashRegistersStore = defineStore('sales-cash-registers', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    deletingId: '',
    filters: defaultRegisterFilters(),
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await salesApi.getCashRegisters({
          search: this.filters.search || undefined,
          branch_id: this.filters.branch_id || undefined,
          status: this.filters.status || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        return response.data
      } finally {
        this.loading = false
      }
    },
    async createItem(payload) {
      this.saving = true

      try {
        const response = await salesApi.createCashRegister(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateItem(id, payload) {
      this.saving = true

      try {
        const response = await salesApi.updateCashRegister(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteItem(id) {
      this.deletingId = id

      try {
        const response = await salesApi.deleteCashRegister(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchItems({ page: nextPage })
        return response.data
      } finally {
        this.deletingId = ''
      }
    },
    async openSession(id, payload) {
      this.saving = true

      try {
        const response = await salesApi.openCashRegisterSession(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async closeSession(id, payload) {
      this.saving = true

      try {
        const response = await salesApi.closeCashRegisterSession(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})

export const useSaleReturnsStore = defineStore('sales-returns', {
  state: () => ({
    items: [],
    loading: false,
    filters: {
      search: '',
      sale_id: '',
      branch_id: '',
      warehouse_id: '',
      date_from: '',
      date_to: '',
      page: 1,
      per_page: 15,
    },
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await salesApi.getSaleReturns({
          search: this.filters.search || undefined,
          sale_id: this.filters.sale_id || undefined,
          branch_id: this.filters.branch_id || undefined,
          warehouse_id: this.filters.warehouse_id || undefined,
          date_from: this.filters.date_from || undefined,
          date_to: this.filters.date_to || undefined,
          page: this.filters.page,
          per_page: this.filters.per_page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        return response.data
      } finally {
        this.loading = false
      }
    },
  },
})
