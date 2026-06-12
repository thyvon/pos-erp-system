import type { SettingsGroupDefinition } from '@/types/settings'

export const SETTINGS_GROUPS: SettingsGroupDefinition[] = [
  {
    key: 'business_profile',
    fields: [],
  },
  {
    key: 'general',
    fields: [
      { key: 'currency', type: 'text' },
      {
        key: 'timezone',
        type: 'select',
        options: [
          { value: 'UTC', label: 'UTC' },
          { value: 'Asia/Phnom_Penh', label: 'Asia/Phnom Penh' },
          { value: 'Asia/Bangkok', label: 'Asia/Bangkok' },
          { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh' },
          { value: 'Asia/Singapore', label: 'Asia/Singapore' },
        ],
      },
      {
        key: 'date_format',
        type: 'select',
        options: [
          { value: 'Y-m-d', label: 'YYYY MMM DD' },
          { value: 'd/m/Y', label: 'DD MMM YYYY' },
          { value: 'm/d/Y', label: 'MMM DD YYYY' },
        ],
      },
      { key: 'decimal_places', type: 'number' },
      {
        key: 'locale',
        type: 'select',
        options: [
          { value: 'en', label: 'English' },
          { value: 'km', label: 'Khmer' },
        ],
      },
    ],
  },
  {
    key: 'invoice',
    fields: [
      { key: 'prefix', type: 'text' },
      { key: 'quotation_prefix', type: 'text' },
      { key: 'start_number', type: 'number' },
      { key: 'show_tax', type: 'boolean' },
      { key: 'show_logo', type: 'boolean' },
      { key: 'show_previous_due', type: 'boolean' },
      { key: 'terms_conditions', type: 'textarea' },
      { key: 'footer_note', type: 'textarea' },
      {
        key: 'invoice_layout',
        type: 'select',
        options: [
          { value: 'classic', label: 'Classic' },
          { value: 'modern', label: 'Modern' },
          { value: 'receipt', label: 'POS Receipt' },
        ],
      },
    ],
  },
  {
    key: 'label_printing',
    fields: [
      {
        key: 'default_template',
        type: 'select',
        options: [
          { value: 'product', label: 'Product label' },
          { value: 'lot', label: 'Lot / expiry label' },
          { value: 'serial', label: 'Serial label' },
          { value: 'price_tag', label: 'Price tag' },
        ],
      },
      {
        key: 'paper_size',
        type: 'select',
        options: [
          { value: 'a4', label: 'A4 sheet' },
          { value: 'roll', label: 'Label roll' },
          { value: 'custom', label: 'Custom' },
        ],
      },
      { key: 'label_width_mm', type: 'number' },
      { key: 'label_height_mm', type: 'number' },
      { key: 'columns', type: 'number' },
      { key: 'gap_mm', type: 'number' },
      { key: 'margin_mm', type: 'number' },
      {
        key: 'quantity_mode',
        type: 'select',
        options: [
          { value: 'received_quantity', label: 'Received quantity' },
          { value: 'one_each_line', label: 'One per line' },
          { value: 'one_each_serial', label: 'One per serial' },
          { value: 'fixed', label: 'Fixed quantity' },
        ],
      },
      {
        key: 'barcode_type',
        type: 'select',
        options: [
          { value: 'code39', label: 'Code 39 barcode' },
          { value: 'none', label: 'No barcode' },
        ],
      },
      {
        key: 'barcode_layout',
        type: 'select',
        options: [
          { value: 'single', label: 'One barcode' },
          { value: 'two_barcodes', label: 'Two barcodes: SKU + lot/serial' },
          { value: 'combined', label: 'Combined: SKU|lot/serial' },
        ],
      },
      { key: 'show_business_name', type: 'boolean' },
      { key: 'show_product_name', type: 'boolean' },
      { key: 'show_sku', type: 'boolean' },
      { key: 'show_price', type: 'boolean' },
      { key: 'show_lot', type: 'boolean' },
      { key: 'show_expiry', type: 'boolean' },
      { key: 'show_barcode_text_lines', type: 'boolean' },
      { key: 'show_received_date', type: 'boolean' },
      { key: 'show_purchase_number', type: 'boolean' },
      { key: 'show_warehouse', type: 'boolean' },
    ],
  },
  {
    key: 'pos',
    fields: [
      { key: 'default_warehouse_id', type: 'text' },
      { key: 'allow_discount', type: 'boolean' },
      { key: 'max_discount_pct', type: 'number' },
      {
        key: 'receipt_printer',
        type: 'select',
        options: [
          { value: 'browser', label: 'Browser' },
          { value: 'network', label: 'Network' },
        ],
      },
      {
        key: 'lot_selection_strategy',
        type: 'select',
        options: [
          { value: 'fefo', label: 'FEFO' },
          { value: 'fifo', label: 'FIFO' },
        ],
      },
      { key: 'require_cash_register_session', type: 'boolean' },
      { key: 'show_customer_display', type: 'boolean' },
      { key: 'enable_subscriptions', type: 'boolean' },
      { key: 'auto_print_receipt', type: 'boolean' },
      {
        key: 'invoice_layout',
        type: 'select',
        options: [
          { value: 'classic', label: 'Classic' },
          { value: 'modern', label: 'Modern' },
          { value: 'receipt', label: 'POS Receipt' },
        ],
      },
      {
        key: 'receipt_paper_size',
        type: 'select',
        options: [
          { value: '80mm', label: '80mm (Standard)' },
          { value: '58mm', label: '58mm (Portable)' },
        ],
      },
    ],
  },
  {
    key: 'stock',
    fields: [
      { key: 'enable_lot_tracking', type: 'boolean' },
      { key: 'enable_serial_tracking', type: 'boolean' },
      { key: 'lot_expiry_alert_days', type: 'number' },
      {
        key: 'default_lot_selection',
        type: 'select',
        options: [
          { value: 'fefo', label: 'FEFO' },
          { value: 'fifo', label: 'FIFO' },
        ],
      },
      { key: 'enable_rack_location', type: 'boolean' },
      { key: 'adjustment_edit_lifetime_days', type: 'number' },
      { key: 'transfer_edit_lifetime_days', type: 'number' },
      { key: 'count_edit_lifetime_days', type: 'number' },
    ],
  },
  {
    key: 'sales',
    fields: [
      { key: 'enable_commission', type: 'boolean' },
      {
        key: 'commission_type',
        type: 'select',
        options: [
          { value: 'invoice_value', label: 'Invoice value' },
          { value: 'profit', label: 'Profit' },
        ],
      },
      { key: 'minimum_sell_price_enabled', type: 'boolean' },
      { key: 'delivery_tracking_enabled', type: 'boolean' },
      { key: 'edit_lifetime_days', type: 'number' },
    ],
  },
  {
    key: 'purchases',
    fields: [
      { key: 'purchase_edit_lifetime_days', type: 'number' },
    ],
  },
  {
    key: 'notifications',
    fields: [
      { key: 'low_stock_threshold', type: 'number' },
      { key: 'payment_due_reminder_days', type: 'number' },
      { key: 'lot_expiry_alert_days', type: 'number' },
    ],
  },
  {
    key: 'email',
    fields: [
      { key: 'driver', type: 'text' },
      { key: 'host', type: 'text' },
      { key: 'port', type: 'number' },
      { key: 'username', type: 'text' },
      { key: 'password', type: 'text' },
      { key: 'from_address', type: 'text' },
      { key: 'from_name', type: 'text' },
    ],
  },
  {
    key: 'sms',
    fields: [
      { key: 'provider', type: 'text' },
      { key: 'api_key', type: 'text' },
      { key: 'api_secret', type: 'text' },
      { key: 'from_number', type: 'text' },
      { key: 'is_active', type: 'boolean' },
    ],
  },
  {
    key: 'loyalty',
    fields: [{ key: 'is_active', type: 'boolean' }],
  },
  {
    key: 'system',
    fields: [
      { key: 'audit_log_retention_months', type: 'number' },
      { key: 'default_page_entries', type: 'number' },
    ],
  },
]
