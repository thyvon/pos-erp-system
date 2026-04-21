import api from './axios'

export const getSales = (params = {}) => api.get('/sales', { params })
export const getSale = (id) => api.get(`/sales/${id}`)
export const createSale = (payload) => api.post('/sales', payload)
export const confirmSale = (id) => api.post(`/sales/${id}/confirm`)
export const completeSale = (id) => api.post(`/sales/${id}/complete`)
export const cancelSale = (id, payload = {}) => api.post(`/sales/${id}/cancel`, payload)
export const recordSalePayment = (id, payload) => api.post(`/sales/${id}/payments`, payload)
export const recordSaleReturn = (id, payload) => api.post(`/sales/${id}/returns`, payload)

export const getSaleReturns = (params = {}) => api.get('/sale-returns', { params })
export const getSaleReturn = (id) => api.get(`/sale-returns/${id}`)

export const getQuotations = (params = {}) => api.get('/quotations', { params })
export const getQuotation = (id) => api.get(`/quotations/${id}`)
export const createQuotation = (payload) => api.post('/quotations', payload)
export const convertQuotation = (id, payload) => api.post(`/quotations/${id}/convert`, payload)
export const cancelQuotation = (id, payload = {}) => api.post(`/quotations/${id}/cancel`, payload)

export const getCashRegisters = (params = {}) => api.get('/cash-registers', { params })
export const getCashRegister = (id) => api.get(`/cash-registers/${id}`)
export const createCashRegister = (payload) => api.post('/cash-registers', payload)
export const updateCashRegister = (id, payload) => api.put(`/cash-registers/${id}`, payload)
export const deleteCashRegister = (id) => api.delete(`/cash-registers/${id}`)
export const openCashRegisterSession = (id, payload) => api.post(`/cash-registers/${id}/open-session`, payload)
export const closeCashRegisterSession = (id, payload) => api.post(`/cash-register-sessions/${id}/close`, payload)
