import api from './axios'

export const getChartOfAccounts = (params = {}) => api.get('/accounting/chart-of-accounts', { params })
export const createChartOfAccount = (payload) => api.post('/accounting/chart-of-accounts', payload)
export const updateChartOfAccount = (id, payload) => api.put(`/accounting/chart-of-accounts/${id}`, payload)
export const deleteChartOfAccount = (id) => api.delete(`/accounting/chart-of-accounts/${id}`)
export const getChartOfAccount = (id) => api.get(`/accounting/chart-of-accounts/${id}`)

export const getJournals = (params = {}) => api.get('/accounting/journals', { params })
export const getJournal = (id) => api.get(`/accounting/journals/${id}`)
export const createJournal = (payload) => api.post('/accounting/journals', payload)
export const reverseJournal = (id, payload) => api.post(`/accounting/journals/${id}/reverse`, payload)

export const getPaymentAccounts = (params = {}) => api.get('/accounting/payment-accounts', { params })
export const createPaymentAccount = (payload) => api.post('/accounting/payment-accounts', payload)
export const updatePaymentAccount = (id, payload) => api.put(`/accounting/payment-accounts/${id}`, payload)
export const deletePaymentAccount = (id) => api.delete(`/accounting/payment-accounts/${id}`)
export const transferPaymentAccounts = (payload) => api.post('/accounting/payment-accounts/transfer', payload)

export const getFiscalYears = (params = {}) => api.get('/accounting/fiscal-years', { params })
export const createFiscalYear = (payload) => api.post('/accounting/fiscal-years', payload)
export const updateFiscalYear = (id, payload) => api.put(`/accounting/fiscal-years/${id}`, payload)
export const deleteFiscalYear = (id) => api.delete(`/accounting/fiscal-years/${id}`)
