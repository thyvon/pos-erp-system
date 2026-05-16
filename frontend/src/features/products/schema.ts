import { z } from 'zod'

const optionalId = z.string().trim().transform((value) => value || null)
const nullableText = z.string().trim().transform((value) => value || null)
const optionalNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  })

const customFieldsSchema = z.preprocess(
  (value) => (Array.isArray(value) ? {} : value),
  z.record(z.string(), z.unknown()).nullable().optional()
)

const variationSchema = z.object({
  id: optionalId.optional(),
  name: z.string().min(1, 'Variation name is required'),
  variation_value_ids: z.array(z.string()).min(1, 'Select at least one value'),
  sku: nullableText.optional(),
  sub_unit_id: optionalId.optional(),
  selling_price: optionalNumber.refine((value) => value !== null && value >= 0, 'Selling price is required'),
  purchase_price: optionalNumber.refine((value) => value !== null && value >= 0, 'Purchase price is required'),
  sub_unit_selling_price: optionalNumber.optional(),
  sub_unit_purchase_price: optionalNumber.optional(),
  minimum_selling_price: optionalNumber.optional(),
  profit_margin: optionalNumber.optional(),
  is_active: z.boolean(),
  image_file: z.custom<File | null>().optional(),
})

const comboItemSchema = z.object({
  id: optionalId.optional(),
  child_product_id: z.string().min(1, 'Product is required'),
  child_variation_id: optionalId.optional(),
  quantity: optionalNumber.refine((value) => value !== null && value > 0, 'Quantity is required'),
})

export const productSchema = z
  .object({
    category_id: optionalId.optional(),
    brand_id: optionalId.optional(),
    unit_id: optionalId.optional(),
    sub_unit_id: optionalId.optional(),
    tax_rate_id: optionalId.optional(),
    rack_location_id: optionalId.optional(),
    price_group_id: optionalId.optional(),
    variation_template_id: optionalId.optional(),
    variation_template_ids: z.array(z.string()).optional(),
    variation_value_map: z.record(z.string(), z.array(z.string())).optional(),
    excluded_variation_keys: z.array(z.string()).optional(),
    name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
    description: nullableText.optional(),
    sku: nullableText.optional(),
    barcode_type: z.enum(['C128', 'EAN13', 'QR']),
    type: z.enum(['single', 'variable', 'service', 'combo']),
    stock_tracking: z.enum(['none', 'lot', 'serial']),
    has_expiry: z.boolean(),
    selling_price: optionalNumber.optional(),
    purchase_price: optionalNumber.optional(),
    sub_unit_selling_price: optionalNumber.optional(),
    sub_unit_purchase_price: optionalNumber.optional(),
    minimum_selling_price: optionalNumber.optional(),
    profit_margin: optionalNumber.optional(),
    tax_type: z.enum(['inclusive', 'exclusive']),
    track_inventory: z.boolean(),
    alert_quantity: optionalNumber.optional(),
    max_stock_level: optionalNumber.optional(),
    is_for_selling: z.boolean(),
    is_active: z.boolean(),
    weight: optionalNumber.optional(),
    image_file: z.custom<File | null>().optional(),
    custom_fields: customFieldsSchema,
    variations: z.array(variationSchema),
    combo_items: z.array(comboItemSchema),
  })
  .superRefine((value, context) => {
    if (value.type !== 'service' && !value.unit_id) {
      context.addIssue({ code: 'custom', path: ['unit_id'], message: 'Unit is required' })
    }

    if (['single', 'service', 'combo'].includes(value.type)) {
      if (value.selling_price === null || value.selling_price === undefined) {
        context.addIssue({ code: 'custom', path: ['selling_price'], message: 'Selling price is required' })
      }
      if (value.purchase_price === null || value.purchase_price === undefined) {
        context.addIssue({ code: 'custom', path: ['purchase_price'], message: 'Purchase price is required' })
      }
    }

    if (value.type === 'variable') {
      const templateIds = value.variation_template_ids?.length
        ? value.variation_template_ids
        : value.variation_template_id
          ? [value.variation_template_id]
          : []

      if (!templateIds.length) {
        context.addIssue({
          code: 'custom',
          path: ['variation_template_ids'],
          message: 'Select at least one variation template',
        })
      }
      if (value.variations.length === 0) {
        context.addIssue({ code: 'custom', path: ['variations'], message: 'Add at least one variation' })
      }
    }

    if (value.type === 'combo' && value.combo_items.length === 0) {
      context.addIssue({ code: 'custom', path: ['combo_items'], message: 'Add at least one combo item' })
    }
  })

export type ProductFormInput = z.input<typeof productSchema>
export type ProductFormValues = z.output<typeof productSchema>
