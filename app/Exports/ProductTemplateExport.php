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
            'selling_price',
            'purchase_price',
            'unit',
            'category',
            'brand',
            'description',
            'stock_tracking',
            'tax_type',
            'track_inventory',
            'is_active',
            'alert_quantity',
            'minimum_selling_price',
            'profit_margin',
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
                '10.00',
                '5.00',
                'pcs',
                'Sample Category',
                'Sample Brand',
                'Optional description',
                'none',
                'exclusive',
                'yes',
                'yes',
                '10',
                '8.00',
                '20',
            ],
        ];
    }

    public function map(mixed $row): array
    {
        return $row;
    }
}
