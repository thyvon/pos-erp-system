<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('settings') || ! Schema::hasTable('businesses')) {
            return;
        }

        $timestamp = now();
        $defaults = [
            'default_template' => ['product', 'string'],
            'paper_size' => ['a4', 'string'],
            'label_width_mm' => ['50', 'integer'],
            'label_height_mm' => ['30', 'integer'],
            'columns' => ['3', 'integer'],
            'gap_mm' => ['2', 'integer'],
            'margin_mm' => ['6', 'integer'],
            'quantity_mode' => ['received_quantity', 'string'],
            'barcode_type' => ['code39', 'string'],
            'barcode_layout' => ['single', 'string'],
            'show_business_name' => ['1', 'boolean'],
            'show_product_name' => ['1', 'boolean'],
            'show_sku' => ['1', 'boolean'],
            'show_price' => ['1', 'boolean'],
            'show_lot' => ['1', 'boolean'],
            'show_expiry' => ['1', 'boolean'],
            'show_barcode_text_lines' => ['1', 'boolean'],
            'show_received_date' => ['0', 'boolean'],
            'show_purchase_number' => ['0', 'boolean'],
            'show_warehouse' => ['0', 'boolean'],
        ];

        foreach (DB::table('businesses')->pluck('id') as $businessId) {
            foreach ($defaults as $key => [$value, $type]) {
                DB::table('settings')->updateOrInsert(
                    [
                        'business_id' => $businessId,
                        'group' => 'label_printing',
                        'key' => $key,
                    ],
                    [
                        'id' => (string) str()->uuid(),
                        'value' => $value,
                        'type' => $type,
                        'group' => 'label_printing',
                        'is_encrypted' => false,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')
            ->where('group', 'label_printing')
            ->delete();
    }
};
