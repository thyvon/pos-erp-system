export type LabelTemplateKey = 'product' | 'lot' | 'serial' | 'price_tag'
export type LabelQuantityMode = 'received_quantity' | 'one_each_line' | 'one_each_serial' | 'fixed'
export type LabelBarcodeType = 'code39' | 'none'
export type LabelBarcodeLayout = 'single' | 'two_barcodes' | 'combined'

export interface LabelPrintOptions {
  template: LabelTemplateKey
  paperSize: 'a4' | 'roll' | 'custom'
  widthMm: number
  heightMm: number
  columns: number
  gapMm: number
  marginMm: number
  quantityMode: LabelQuantityMode
  fixedQuantity: number
  barcodeType: LabelBarcodeType
  barcodeLayout: LabelBarcodeLayout
  showBusinessName: boolean
  showProductName: boolean
  showSku: boolean
  showPrice: boolean
  showLot: boolean
  showExpiry: boolean
  showBarcodeTextLines: boolean
  showReceivedDate: boolean
  showPurchaseNumber: boolean
  showWarehouse: boolean
}

export interface LabelSourceItem {
  id: string
  receiveId: string
  receiveNumber: string
  receivedAt: string | null
  productName: string
  sku: string | null
  price: string | number | null
  lotNumber: string | null
  expiryDate: string | null
  serialNumber: string | null
  quantity: number
  purchaseNumber: string
  warehouseName: string | null
}

export interface ExpandedLabelItem extends LabelSourceItem {
  printKey: string
}
