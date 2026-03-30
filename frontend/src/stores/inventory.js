import { defineStore } from 'pinia'
import * as inventoryApi from '@api/inventory'

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

export const useInventoryOptionsStore = defineStore('inventory-options', {
  state: () => ({
    loaded: false,
    loading: false,
    products: [],
    warehouses: [],
    transferFromWarehouses: [],
    transferToWarehouses: [],
  }),
  actions: {
    async fetchOptions(force = false) {
      if (this.loaded && !force) {
        return
      }

      this.loading = true

      try {
        const response = await inventoryApi.getInventoryOptions()
        this.products = response.data.data.products || []
        this.warehouses = response.data.data.warehouses || []
        this.transferFromWarehouses = response.data.data.transfer_from_warehouses || []
        this.transferToWarehouses = response.data.data.transfer_to_warehouses || []
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
  },
})

export const useInventoryAdjustmentsStore = defineStore('inventory-adjustments', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    filters: defaultFilters(),
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await inventoryApi.getStockAdjustments({
          search: this.filters.search || undefined,
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
        const response = await inventoryApi.createStockAdjustment(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})

export const useInventoryTransfersStore = defineStore('inventory-transfers', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    filters: defaultFilters(),
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await inventoryApi.getStockTransfers({
          search: this.filters.search || undefined,
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
        const response = await inventoryApi.createStockTransfer(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})

export const useInventoryCountsStore = defineStore('inventory-counts', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    recording: false,
    updatingItemId: '',
    completing: false,
    filters: { ...defaultFilters(), status: '' },
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await inventoryApi.getStockCounts({
          search: this.filters.search || undefined,
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
        const response = await inventoryApi.createStockCount(payload)
        await this.fetchItems({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async fetchItem(id) {
      const response = await inventoryApi.getStockCount(id)
      return response.data.data
    },
    async recordEntry(id, payload) {
      this.recording = true
      try {
        const response = await inventoryApi.recordStockCountEntry(id, payload)
        return response.data
      } finally {
        this.recording = false
      }
    },
    async updateItem(countId, itemId, payload) {
      this.updatingItemId = itemId
      try {
        const response = await inventoryApi.updateStockCountItem(countId, itemId, payload)
        return response.data
      } finally {
        this.updatingItemId = ''
      }
    },
    async completeItem(id, payload) {
      this.completing = true
      try {
        const response = await inventoryApi.completeStockCount(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.completing = false
      }
    },
  },
})

export const useInventoryLotsStore = defineStore('inventory-lots', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    filters: { ...defaultFilters(), status: '' },
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await inventoryApi.getStockLots({
          search: this.filters.search || undefined,
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
    async updateStatus(id, payload) {
      this.saving = true
      try {
        const response = await inventoryApi.updateLotStatus(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})

export const useInventorySerialsStore = defineStore('inventory-serials', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    filters: { ...defaultFilters(), status: '' },
    pagination: defaultPagination(),
  }),
  actions: {
    async fetchItems(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await inventoryApi.getStockSerials({
          search: this.filters.search || undefined,
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
    async writeOff(id, payload) {
      this.saving = true
      try {
        const response = await inventoryApi.writeOffSerial(id, payload)
        await this.fetchItems()
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})
