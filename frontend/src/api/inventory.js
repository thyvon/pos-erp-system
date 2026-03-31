import api from './axios'

export const getInventoryOptions = () => api.get('/inventory/options')
export const searchInventoryProductLookup = (params = {}) => api.get('/inventory/product-lookup', { params })

export const getStockAdjustments = (params = {}) => api.get('/inventory/adjustments', { params })
export const createStockAdjustment = (payload) => api.post('/inventory/adjustments', payload)
export const getStockAdjustment = (id) => api.get(`/inventory/adjustments/${id}`)

export const getStockTransfers = (params = {}) => api.get('/inventory/transfers', { params })
export const createStockTransfer = (payload) => api.post('/inventory/transfers', payload)
export const getStockTransfer = (id) => api.get(`/inventory/transfers/${id}`)

export const getStockCounts = (params = {}) => api.get('/inventory/counts', { params })
export const createStockCount = (payload) => api.post('/inventory/counts', payload)
export const getStockCount = (id) => api.get(`/inventory/counts/${id}`)
export const getStockCountItems = (id, params = {}) => api.get(`/inventory/counts/${id}/items`, { params })
export const recordStockCountEntry = (id, payload) => api.post(`/inventory/counts/${id}/entries`, payload)
export const updateStockCountItem = (countId, itemId, payload) => api.post(`/inventory/counts/${countId}/items/${itemId}`, payload)
export const completeStockCount = (id, payload) => api.post(`/inventory/counts/${id}/complete`, payload)

export const getStockLots = (params = {}) => api.get('/inventory/lots', { params })
export const getStockLot = (id) => api.get(`/inventory/lots/${id}`)
export const updateLotStatus = (id, payload) => api.post(`/inventory/lots/${id}/status`, payload)

export const getStockSerials = (params = {}) => api.get('/inventory/serials', { params })
export const getStockSerial = (id) => api.get(`/inventory/serials/${id}`)
export const writeOffSerial = (id, payload) => api.post(`/inventory/serials/${id}/write-off`, payload)
