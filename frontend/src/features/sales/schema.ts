import { z } from 'zod'

const nullableText = () =>
  z.string().trim().transform((value) => value || null)

const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'] as const

const saleDirectPaymentLineSchema = z.object({
  sale_payment_id: z.string().optional(),
  payment_account_id: z.string().min(1, 'Payment account is required'),
  payment_currency: z.enum(['USD', 'KHR']),
  payment_amount: z.coerce.number().gt(0, 'Amount must be greater than zero'),
  method: z.enum(paymentMethods),
  reference: z.string().trim().max(120, 'Reference must be 120 characters or less').nullable().optional(),
})

const saleDirectPaymentDraftLineSchema = z.object({
  sale_payment_id: z.string().optional(),
  payment_account_id: z.string().optional(),
  payment_currency: z.enum(['USD', 'KHR']).optional(),
  payment_amount: z.coerce.number().optional(),
  method: z.enum(paymentMethods).optional(),
  reference: z.string().trim().max(120, 'Reference must be 120 characters or less').nullable().optional(),
})

export const saleItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variation_id: z.string().nullable().optional(),
  sub_unit_id: z.string().nullable().optional(),
  unit_id: z.string().nullable().optional(),
  sub_unit_label: z.string().nullable().optional(),
  _base_unit_label: z.string().nullable().optional(),
  _sub_unit_option_id: z.string().nullable().optional(),
  _base_unit_price: z.coerce.number().optional().default(0),
  _sub_unit_price: z.coerce.number().optional().default(0),
  _conversion_factor: z.string().nullable().optional(),
  lot_id: z.string().nullable().optional(),
  serial_id: z.string().nullable().optional(),
  stock_tracking: z.string().nullable().optional(),
  product_label: z.string().optional(),
  sku: z.string().nullable().optional(),
  lot_number: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  unit_label: z.string().nullable().optional(),
  available_quantity: z.string().nullable().optional(),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  unit_price: z.coerce.number().min(0, 'Unit price cannot be negative'),
  discount_type: z.enum(['fixed', 'percentage']).nullable().optional(),
  discount_amount: z.coerce.number().min(0, 'Discount cannot be negative').nullable().optional(),
  tax_rate_id: z.string().nullable().optional(),
  tax_rate_type: z.enum(['percentage', 'fixed']).nullable().optional(),
  tax_rate: z.coerce.number().min(0, 'Tax cannot be negative').nullable().optional(),
  tax_type: z.enum(['inclusive', 'exclusive']).nullable().optional(),
  unit_cost: z.coerce.number().min(0, 'Unit cost cannot be negative').nullable().optional(),
  notes: nullableText().optional(),
}).superRefine((value, context) => {
  if (value.stock_tracking === 'lot' && !value.lot_id) {
    context.addIssue({
      code: 'custom',
      path: ['lot_id'],
      message: 'Select a lot number for this tracked item',
    })
  }

  if (value.stock_tracking === 'serial') {
    if (!value.serial_id) {
      context.addIssue({
        code: 'custom',
        path: ['serial_id'],
        message: 'Select a serial number for this tracked item',
      })
    }

    if (value.quantity !== 1) {
      context.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: 'Serial tracked items must have a quantity of one',
      })
    }
  }
})

export const saleFormSchema = z.object({
  branch_id: z.string().min(1, 'Branch is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  customer_id: z.string().nullable().optional(),
  cash_register_session_id: z.string().nullable().optional(),
  type: z.enum(['invoice', 'pos_sale', 'draft', 'suspended', 'quotation']),
  sale_date: z.string().min(1, 'Sale date is required'),
  due_date: z.string().nullable().optional(),
  price_group_id: z.string().nullable().optional(),
  discount_type: z.enum(['fixed', 'percentage']).nullable().optional(),
  discount_amount: z.coerce.number().min(0, 'Discount cannot be negative').nullable().optional(),
  tax_scope: z.enum(['line', 'sale']),
  tax_rate_id: z.string().nullable().optional(),
  tax_rate_type: z.enum(['percentage', 'fixed']).nullable().optional(),
  tax_rate: z.coerce.number().min(0, 'Tax cannot be negative').nullable().optional(),
  tax_type: z.enum(['inclusive', 'exclusive']).nullable().optional(),
  shipping_charges: z.coerce.number().min(0, 'Shipping cannot be negative').nullable().optional(),
  direct_payment_enabled: z.boolean().optional(),
  direct_payments: z.array(saleDirectPaymentDraftLineSchema).optional(),
  notes: nullableText().optional(),
  staff_note: nullableText().optional(),
  items: z.array(saleItemSchema).min(1, 'Add at least one sale item'),
}).refine((values) => !values.due_date || values.due_date >= values.sale_date, {
  path: ['due_date'],
  message: 'Due date must be on or after the sale date',
}).superRefine((values, context) => {
  if (!values.direct_payment_enabled) return

  if (!values.direct_payments?.length) {
    context.addIssue({
      code: 'custom',
      path: ['direct_payments'],
      message: 'Add at least one payment line',
    })

    return
  }

  values.direct_payments.forEach((line, index) => {
    const result = saleDirectPaymentLineSchema.safeParse(line)

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        context.addIssue({
          code: 'custom',
          path: ['direct_payments', index, ...(issue.path ?? [])],
          message: issue.message,
        })
      })
    }
  })
})

export type SaleFormInput = z.input<typeof saleFormSchema>
export type SaleFormValues = z.output<typeof saleFormSchema>

export const saleCancelSchema = z.object({
  reason: z.string().trim().max(500, 'Reason must be 500 characters or less').nullable().optional(),
})

export type SaleCancelFormInput = z.input<typeof saleCancelSchema>
export type SaleCancelFormValues = z.output<typeof saleCancelSchema>

const salePaymentLineSchema = z.object({
  payment_account_id: z.string().min(1, 'Payment account is required'),
  payment_currency: z.enum(['USD', 'KHR']),
  payment_amount: z.coerce.number().gt(0, 'Amount must be greater than zero'),
  amount: z.coerce.number().gt(0, 'Amount must be greater than zero').optional(),
  exchange_rate_id: z.string().nullable().optional(),
  method: z.enum(paymentMethods),
  reference: z.string().trim().max(120, 'Reference must be 120 characters or less').nullable().optional(),
})

export const salePaymentSchema = z.object({
  payment_date: z.string().min(1, 'Payment date is required'),
  note: z.string().trim().nullable().optional(),
  payments: z.array(salePaymentLineSchema).min(1, 'Add at least one payment line'),
})

export type SalePaymentFormInput = z.input<typeof salePaymentSchema>
export type SalePaymentFormValues = z.output<typeof salePaymentSchema>

const refundMethods = ['cash', 'credit_note', 'bank_transfer'] as const

export const saleReturnLineSchema = z.object({
  sale_item_id: z.string().min(1, 'Sale item is required'),
  quantity: z.coerce.number().gt(0, 'Quantity must be greater than zero'),
  lot_id: z.string().nullable().optional(),
  serial_ids: z.array(z.string()).optional(),
})

export const saleReturnSchema = z.object({
  return_date: z.string().min(1, 'Return date is required'),
  refund_method: z.enum(refundMethods),
  payment_account_id: z.string().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  items: z.array(saleReturnLineSchema).min(1, 'Add at least one return line'),
}).superRefine((values, context) => {
  if (values.refund_method !== 'credit_note' && !values.payment_account_id) {
    context.addIssue({
      code: 'custom',
      path: ['payment_account_id'],
      message: 'Select a payment account for the refund',
    })
  }
})

export type SaleReturnFormInput = z.input<typeof saleReturnSchema>
export type SaleReturnFormValues = z.output<typeof saleReturnSchema>

export const quotationConvertSchema = z.object({
  type: z.enum(['invoice', 'draft', 'pos_sale', 'suspended']),
  sale_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  staff_note: z.string().trim().nullable().optional(),
}).refine((values) => !values.due_date || !values.sale_date || values.due_date >= values.sale_date, {
  path: ['due_date'],
  message: 'Due date must be on or after the sale date',
})

export type QuotationConvertFormInput = z.input<typeof quotationConvertSchema>
export type QuotationConvertFormValues = z.output<typeof quotationConvertSchema>
