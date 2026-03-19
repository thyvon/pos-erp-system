<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DefaultSettingsSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('businesses') || ! Schema::hasTable('settings')) {
            return;
        }

        $businessIds = DB::table('businesses')->pluck('id');
        $timestamp = now();

        foreach ($businessIds as $businessId) {
            foreach ($this->defaultSettings() as $setting) {
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

    protected function defaultSettings(): array
    {
        return [
            ['group' => 'general', 'key' => 'currency', 'value' => 'USD', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'timezone', 'value' => 'Asia/Phnom_Penh', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'date_format', 'value' => 'Y-m-d', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'decimal_places', 'value' => '2', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'thousand_separator', 'value' => ',', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'financial_year_start', 'value' => '1', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'general', 'key' => 'country', 'value' => 'KH', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'invoice', 'key' => 'prefix', 'value' => 'INV', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'start_number', 'value' => '1', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'footer_note', 'value' => '', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'terms_conditions', 'value' => '', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'show_tax', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'show_discount', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'show_logo', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'show_barcode', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'invoice', 'key' => 'custom_fields', 'value' => json_encode([]), 'type' => 'json', 'is_encrypted' => false],

            ['group' => 'tax', 'key' => 'default_tax_rate_id', 'value' => null, 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'tax', 'key' => 'default_tax_type', 'value' => 'exclusive', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'pos', 'key' => 'default_warehouse_id', 'value' => null, 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'default_price_group_id', 'value' => null, 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'allow_negative_stock', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'require_customer', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'allow_discount', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'max_discount_pct', 'value' => '100', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'receipt_printer', 'value' => 'browser', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'show_featured_products', 'value' => '1', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'enable_service_staff', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'pos', 'key' => 'lot_selection_strategy', 'value' => 'fefo', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'stock', 'key' => 'enable_lot_tracking', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'enable_serial_tracking', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'lot_expiry_alert_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'stock', 'key' => 'default_lot_selection', 'value' => 'fefo', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'email', 'key' => 'driver', 'value' => 'smtp', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'email', 'key' => 'host', 'value' => '127.0.0.1', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'email', 'key' => 'port', 'value' => '1025', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'email', 'key' => 'username', 'value' => null, 'type' => 'string', 'is_encrypted' => true],
            ['group' => 'email', 'key' => 'from_address', 'value' => 'noreply@erp.local', 'type' => 'string', 'is_encrypted' => false],
            ['group' => 'email', 'key' => 'from_name', 'value' => 'ERP System', 'type' => 'string', 'is_encrypted' => false],

            ['group' => 'notifications', 'key' => 'low_stock_threshold', 'value' => '10', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'notifications', 'key' => 'payment_due_reminder_days', 'value' => '3', 'type' => 'integer', 'is_encrypted' => false],
            ['group' => 'notifications', 'key' => 'lot_expiry_alert_days', 'value' => '30', 'type' => 'integer', 'is_encrypted' => false],

            ['group' => 'loyalty', 'key' => 'is_active', 'value' => '0', 'type' => 'boolean', 'is_encrypted' => false],
        ];
    }
}
