const statusClasses = {
  active: 'erp-badge-success',
  posted: 'erp-badge-success',
  closed: 'erp-badge-neutral',
  reversed: 'erp-badge-danger',
  inactive: 'erp-badge-danger',
}

const typeClasses = {
  asset: 'erp-badge-info',
  liability: 'erp-badge-warning',
  equity: 'erp-badge-neutral',
  revenue: 'erp-badge-success',
  expense: 'erp-badge-danger',
  bank: 'erp-badge-info',
  cash: 'erp-badge-success',
  other: 'erp-badge-warning',
  manual: 'erp-badge-info',
  reversal: 'erp-badge-danger',
  purchase: 'erp-badge-warning',
  sale: 'erp-badge-success',
  payment_in: 'erp-badge-success',
  payment_out: 'erp-badge-warning',
  sale_return: 'erp-badge-danger',
  purchase_return: 'erp-badge-danger',
  opening: 'erp-badge-neutral',
  manufacturing: 'erp-badge-info',
}

export const startCase = (value) =>
  String(value ?? '')
    .trim()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export const getAccountingStatusClass = (status) => statusClasses[String(status || '').toLowerCase()] || 'erp-badge-neutral'

export const getAccountingTypeClass = (type) => typeClasses[String(type || '').toLowerCase()] || 'erp-badge-neutral'

export const formatAccountingMoney = (value, currency = 'USD') => {
  const amount = Number(value || 0)
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency === 'KHR' ? 0 : 2,
    maximumFractionDigits: currency === 'KHR' ? 0 : 2,
  })

  return `${currency} ${formatter.format(amount)}`
}
