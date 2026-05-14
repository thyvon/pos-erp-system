import type { SettingsGroupDefinition } from '@/types/settings'

export const SETTINGS_GROUPS: SettingsGroupDefinition[] = [
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
          { value: 'Y-m-d', label: 'YYYY-MM-DD' },
          { value: 'd/m/Y', label: 'DD/MM/YYYY' },
          { value: 'm/d/Y', label: 'MM/DD/YYYY' },
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
