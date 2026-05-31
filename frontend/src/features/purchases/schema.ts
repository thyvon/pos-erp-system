import { z } from 'zod'

export const purchaseItemSchema = z.object({
  product_id: z.string().uuid(),
  variation_id: z.string().uuid().nullable().optional(),
  product_label: z.string().min(1),
  sku: z.string().nullable().optional(),
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  sub_unit_id: z.string().nullable().optional(),
  unit_label: z.string().nullable().optional(),
  has_sub_unit: z.boolean().optional(),
  _default_sub_unit_id: z.string().nullable().optional(),
  conversion_factor: z.string().nullable().optional(),
  stock_tracking: z.string().nullable().optional(),
  quantity: z.coerce.number().gt(0),
  unit_cost: z.coerce.number().min(0),
  discount_type: z.enum(['fixed', 'percentage']).nullable().optional(),
  discount_amount: z.coerce.number().min(0).optional().default(0),
  tax_rate_id: z.string().nullable().optional(),
  tax_rate_type: z.string().nullable().optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
  tax_type: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const purchaseSchema = z.object({
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  supplier_invoice_no: z.string().nullable().optional(),
  status: z.enum(['draft', 'confirmed']).default('draft'),
  purchase_date: z.string().min(1),
  expected_date: z.string().nullable().optional(),
  discount_type: z.enum(['fixed', 'percentage']).nullable().optional(),
  discount_amount: z.coerce.number().min(0).optional().default(0),
  tax_scope: z.enum(['line', 'sale']).optional().default('line'),
  tax_rate_id: z.string().nullable().optional(),
  tax_rate_type: z.string().nullable().optional(),
  tax_rate: z.coerce.number().min(0).optional().default(0),
  tax_type: z.string().nullable().optional(),
  shipping_charges: z.coerce.number().min(0).optional().default(0),
  notes: z.string().nullable().optional(),
  staff_note: z.string().nullable().optional(),
  items: z.array(purchaseItemSchema).min(1),
})

export const receivePurchaseItemSchema = z.object({
  purchase_item_id: z.string().uuid(),
  product_label: z.string(),
  sku: z.string().nullable().optional(),
  stock_tracking: z.string().nullable().optional(),
  sub_unit_id: z.string().nullable().optional(),
  _conversion_factor: z.string().nullable().optional(),
  _base_unit_label: z.string().nullable().optional(),
  sub_unit_label: z.string().nullable().optional(),
  remaining_quantity: z.number(),
  quantity: z.coerce.number().gt(0),
  lot_number: z.string().nullable().optional(),
  manufacture_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  serial_numbers_text: z.string().nullable().optional(),
  warranty_expires: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.quantity > value.remaining_quantity) {
    ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'Quantity exceeds remaining quantity' })
  }

  if (value.stock_tracking === 'lot' && !value.lot_number?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['lot_number'], message: 'Lot number is required' })
  }

  if (value.stock_tracking === 'serial') {
    const serials = (value.serial_numbers_text ?? '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
    if (serials.length !== value.quantity) {
      ctx.addIssue({ code: 'custom', path: ['serial_numbers_text'], message: 'Enter one serial number per unit' })
    }
  }
})

export const receivePurchaseSchema = z.object({
  received_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(receivePurchaseItemSchema).min(1),
})

const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'] as const

const purchasePaymentLineSchema = z.object({
  payment_account_id: z.string().min(1, 'Payment account is required'),
  payment_currency: z.enum(['USD', 'KHR']),
  payment_amount: z.coerce.number().gt(0, 'Amount must be greater than zero'),
  amount: z.coerce.number().gt(0, 'Amount must be greater than zero').optional(),
  exchange_rate_id: z.string().nullable().optional(),
  method: z.enum(paymentMethods),
  reference: z.string().trim().max(120, 'Reference must be 120 characters or less').nullable().optional(),
})

export const purchasePaymentSchema = z.object({
  payment_date: z.string().min(1, 'Payment date is required'),
  note: z.string().trim().nullable().optional(),
  reason: z.string().trim().optional(),
  payments: z.array(purchasePaymentLineSchema).min(1, 'Add at least one payment line'),
})

export const purchaseReturnLineSchema = z.object({
  purchase_item_id: z.string().min(1, 'Purchase item is required'),
  quantity: z.coerce.number().gt(0, 'Quantity must be greater than zero'),
  lot_id: z.string().nullable().optional(),
  serial_ids: z.array(z.string()).optional(),
})

export const purchaseReturnSchema = z.object({
  return_date: z.string().min(1, 'Return date is required'),
  notes: z.string().trim().nullable().optional(),
  items: z.array(purchaseReturnLineSchema).min(1, 'Add at least one return line'),
})

export type PurchaseFormInput = z.input<typeof purchaseSchema>
export type PurchaseFormValues = z.output<typeof purchaseSchema>
export type ReceivePurchaseFormInput = z.input<typeof receivePurchaseSchema>
export type ReceivePurchaseFormValues = z.output<typeof receivePurchaseSchema>
export type PurchasePaymentFormInput = z.input<typeof purchasePaymentSchema>
export type PurchasePaymentFormValues = z.output<typeof purchasePaymentSchema>
export type PurchaseReturnFormInput = z.input<typeof purchaseReturnSchema>
export type PurchaseReturnFormValues = z.output<typeof purchaseReturnSchema>
