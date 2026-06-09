<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class ProductTemplateExport implements FromArray, WithHeadings, WithMapping, WithStrictNullComparison
{
    public function headings(): array
    {
        return [
            'name',
            'type',
            'sku',
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
            'selling_price',
            'purchase_price',
            'sub_unit_selling_price',
            'sub_unit_purchase_price',
            'alert_quantity',
            'max_stock_level',
            'minimum_selling_price',
            'profit_margin',
            'weight',
            'variation_templates',
            'variations',
            'combo_items',
            'custom_fields',
        ];
    }

    public function array(): array
    {
        return [
            [
                'Sample Product',
                'single',
                'SMP-001',
                'C128',
                'pcs',
                'box',
                'Sample Category',
                'Sample Brand',
                'VAT 10%',
                'Retail',
                'RK-001',
                'Optional description',
                'none',
                'no',
                'exclusive',
                'yes',
                'yes',
                'yes',
                '10.00',
                '5.00',
                '9.50',
                '4.50',
                '10',
                '100',
                '8.00',
                '20',
                '0.250',
                '',
                '',
                '',
                '{"color":"Blue","size":"Medium"}',
            ],
            [
                'Sample Variable Product',
                'variable',
                'VAR-001',
                'C128',
                'pcs',
                '',
                'Sample Category',
                'Sample Brand',
                'VAT 10%',
                '',
                '',
                'Use JSON in variations for variable products',
                'none',
                'no',
                'exclusive',
                'yes',
                'yes',
                'yes',
                '',
                '',
                '',
                '',
                '5',
                '',
                '',
                '',
                '',
                'Size,Color',
                '[{"name":"Small-Red","values":["Small","Red"],"sku":"VAR-001-SR","selling_price":12,"purchase_price":6,"is_active":true}]',
                '',
                '{}',
            ],
            [
                'Sample Combo Product',
                'combo',
                'CMB-001',
                'C128',
                'pcs',
                '',
                'Sample Category',
                'Sample Brand',
                '',
                '',
                '',
                'Use existing child product SKU/name/id in combo_items',
                'none',
                'no',
                'exclusive',
                'no',
                'yes',
                'yes',
                '20.00',
                '10.00',
                '',
                '',
                '',
                '',
                '18.00',
                '',
                '',
                '',
                '',
                '[{"child_product":"SMP-001","quantity":2}]',
                '{}',
            ],
        ];
    }

    public function map(mixed $row): array
    {
        return $row;
    }
}
