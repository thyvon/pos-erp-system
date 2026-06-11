<?php

namespace App\Support\Foundation;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DefaultSettings
{
    public static function definitions(): array
    {
        return [
            ['group' => 'general', 'key' => 'currency', 'value' => 'USD', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'timezone', 'value' => 'UTC', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'date_format', 'value' => 'Y-m-d', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'decimal_places', 'value' => '2', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'locale', 'value' => 'en', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'invoice', 'key' => 'prefix', 'value' => 'INV', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'quotation_prefix', 'value' => 'QT', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'start_number', 'value' => '1', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'show_tax', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'show_logo', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'show_previous_due', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'terms_conditions', 'value' => '', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'footer_note', 'value' => '', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'invoice_layout', 'value' => 'classic', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'label_printing', 'key' => 'default_template', 'value' => 'product', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'paper_size', 'value' => 'a4', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'label_width_mm', 'value' => '50', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'label_height_mm', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'columns', 'value' => '3', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'gap_mm', 'value' => '2', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'margin_mm', 'value' => '6', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'quantity_mode', 'value' => 'received_quantity', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'barcode_type', 'value' => 'code39', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'barcode_layout', 'value' => 'single', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_business_name', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_product_name', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_sku', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_price', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_lot', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_expiry', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_barcode_text_lines', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_received_date', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_purchase_number', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'label_printing', 'key' => 'show_warehouse', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],

            ['group' => 'pos', 'key' => 'default_warehouse_id', 'value' => null, 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'allow_discount', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'max_discount_pct', 'value' => '100', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'receipt_printer', 'value' => 'browser', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'lot_selection_strategy', 'value' => 'fefo', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'require_cash_register_session', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'show_customer_display', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'enable_subscriptions', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],

            ['group' => 'stock', 'key' => 'enable_lot_tracking', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'enable_serial_tracking', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'lot_expiry_alert_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'default_lot_selection', 'value' => 'fefo', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'enable_rack_location', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'adjustment_edit_lifetime_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'transfer_edit_lifetime_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'count_edit_lifetime_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'enable_auto_lot_number', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'lot_number_prefix', 'value' => 'LOT', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'lot_number_format', 'value' => 'MMYY', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'email', 'key' => 'driver', 'value' => 'smtp', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'email', 'key' => 'host', 'value' => '127.0.0.1', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'email', 'key' => 'port', 'value' => '1025', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'email', 'key' => 'username', 'value' => null, 'type' => 'string', 'is_encrypted' => true],
            ['group' => 'email', 'key' => 'password', 'value' => null, 'type' => 'string', 'is_encrypted' => true],
            ['group' => 'email', 'key' => 'from_address', 'value' => 'noreply@erp.local', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'email', 'key' => 'from_name', 'value' => 'ERP System', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'sms', 'key' => 'provider', 'value' => 'custom', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'sms', 'key' => 'api_key', 'value' => null, 'type' => 'string', 'is_encrypted' => true],
            ['group' => 'sms', 'key' => 'api_secret', 'value' => null, 'type' => 'string', 'is_encrypted' => true],
            ['group' => 'sms', 'key' => 'from_number', 'value' => null, 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'sms', 'key' => 'is_active', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],

            ['group' => 'notifications', 'key' => 'low_stock_threshold', 'value' => '10', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'notifications', 'key' => 'payment_due_reminder_days', 'value' => '3', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'notifications', 'key' => 'lot_expiry_alert_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],

            ['group' => 'loyalty', 'key' => 'is_active', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],

            ['group' => 'sales', 'key' => 'enable_commission', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'sales', 'key' => 'commission_type', 'value' => 'invoice_value', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'sales', 'key' => 'minimum_sell_price_enabled', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'sales', 'key' => 'delivery_tracking_enabled', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'sales', 'key' => 'edit_lifetime_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'purchases', 'key' => 'purchase_edit_lifetime_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],

            ['group' => 'system', 'key' => 'audit_log_retention_months', 'value' => '24', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'system', 'key' => 'default_page_entries', 'value' => '25', 'type' => 'integer', 'is_encrypted' => false],
        ];
    }

    public static function seedBusiness(string $businessId): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        $timestamp = now();

        foreach (self::definitions() as $setting) {
            DB::table('settings')->updateOrInsert(
                [
                    'business_id' => $businessId,
                    'group' => $setting['group'],
                    'key' => $setting['key'],
                ],
                [
                    'id' => (string) Str::uuid(),
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                    'group' => $setting['group'],
                    'is_encrypted' => $setting['is_encrypted'],
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]
            );
        }
    }
}
