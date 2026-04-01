export const TRANSFER_STATUS_PENDING = 'pending'
export const TRANSFER_STATUS_IN_TRANSIT = 'in_transit'
export const TRANSFER_STATUS_RECEIVED = 'received'

export const getStockTransferStatusLabel = (status) => {
  if (status === TRANSFER_STATUS_PENDING) return 'Pending'
  if (status === TRANSFER_STATUS_IN_TRANSIT) return 'In Transit'
  if (status === TRANSFER_STATUS_RECEIVED) return 'Received'
  return status || 'Unknown'
}

export const getStockTransferStatusClasses = (status) => {
  if (status === TRANSFER_STATUS_PENDING) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
  }

  if (status === TRANSFER_STATUS_IN_TRANSIT) {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
  }

  if (status === TRANSFER_STATUS_RECEIVED) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  }

  return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
}

export const isStockTransferEditable = (status) =>
  [TRANSFER_STATUS_PENDING, TRANSFER_STATUS_IN_TRANSIT].includes(status)

export const isStockTransferPending = (status) => status === TRANSFER_STATUS_PENDING

export const isStockTransferInTransit = (status) => status === TRANSFER_STATUS_IN_TRANSIT
