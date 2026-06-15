<?php

namespace App\Exports;

class VariableProductTemplateExport extends AbstractProductTemplateExport
{
    public function headings(): array
    {
        return [
            'name',
            'type',
            'sku',
            'parent_sku',
            'barcode_type',
            'unit',
            'sub_unit',
            'category',
            'brand',
            'tax_rate',
            'price_group',
            'rack_location',
            'description',
            'stock_tracking',
            'has_expiry',
            'tax_type',
            'track_inventory',
            'is_for_selling',
            'is_active',
            'alert_quantity',
            'max_stock_level',
            'weight',
            'variation_templates',
            'variation_name',
            'variation_sku',
            'variation_selling_price',
            'variation_purchase_price',
            'variation_values',
            'variation_sub_unit_selling_price',
            'variation_sub_unit_purchase_price',
            'variation_minimum_selling_price',
            'variation_profit_margin',
            'variation_is_active',
            'custom_fields',
        ];
    }

    protected function sampleRows(): array
    {
        return [
            [
                'name' => 'Sample Variable Product',
                'type' => 'variable',
                'sku' => 'VAR-001',
                'barcode_type' => 'C128',
                'unit' => 'pcs',
                'category' => 'Sample Category',
                'brand' => 'Sample Brand',
                'tax_rate' => 'VAT 10%',
                'description' => 'Keep each variation directly below its parent product',
                'stock_tracking' => 'none',
                'has_expiry' => 'no',
                'tax_type' => 'exclusive',
                'track_inventory' => 'yes',
                'is_for_selling' => 'yes',
                'is_active' => 'yes',
                'alert_quantity' => '5',
                'variation_templates' => 'Size,Color',
                'custom_fields' => '{}',
            ],
            [
                'parent_sku' => 'VAR-001',
                'variation_name' => 'Small-Red',
                'variation_sku' => 'VAR-001-SR',
                'variation_selling_price' => '12.00',
                'variation_purchase_price' => '6.00',
                'variation_values' => 'Small,Red',
                'variation_minimum_selling_price' => '10.00',
                'variation_is_active' => 'yes',
            ],
            [
                'parent_sku' => 'VAR-001',
                'variation_name' => 'Small-Blue',
                'variation_sku' => 'VAR-001-SB',
                'variation_selling_price' => '12.00',
                'variation_purchase_price' => '6.00',
                'variation_values' => 'Small,Blue',
                'variation_minimum_selling_price' => '10.00',
                'variation_is_active' => 'yes',
            ],
            [
                'parent_sku' => 'VAR-001',
                'variation_name' => 'Large-Red',
                'variation_sku' => 'VAR-001-LR',
                'variation_selling_price' => '15.00',
                'variation_purchase_price' => '7.50',
                'variation_values' => 'Large,Red',
                'variation_minimum_selling_price' => '12.00',
                'variation_is_active' => 'yes',
            ],
            [
                'parent_sku' => 'VAR-001',
                'variation_name' => 'Large-Blue',
                'variation_sku' => 'VAR-001-LB',
                'variation_selling_price' => '15.00',
                'variation_purchase_price' => '7.50',
                'variation_values' => 'Large,Blue',
                'variation_minimum_selling_price' => '12.00',
                'variation_is_active' => 'yes',
            ],
        ];
    }
}
