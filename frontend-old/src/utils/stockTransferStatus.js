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
    return 'erp-badge-warning'
  }

  if (status === TRANSFER_STATUS_IN_TRANSIT) {
    return 'erp-badge-info'
  }

  if (status === TRANSFER_STATUS_RECEIVED) {
    return 'erp-badge-success'
  }

  return 'erp-badge-neutral'
}

export const isStockTransferEditable = (status) =>
  [TRANSFER_STATUS_PENDING, TRANSFER_STATUS_IN_TRANSIT].includes(status)

export const isStockTransferPending = (status) => status === TRANSFER_STATUS_PENDING

export const isStockTransferInTransit = (status) => status === TRANSFER_STATUS_IN_TRANSIT
