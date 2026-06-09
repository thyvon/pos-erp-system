<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class StockOpeningBalanceTemplateExport implements FromArray, WithHeadings, WithMapping, WithStrictNullComparison
{
    public function headings(): array
    {
        return [
            'warehouse',
            'date',
            'product_sku',
            'product_name',
            'variation_sku',
            'variation_name',
            'quantity',
            'unit_cost',
            'lot_number',
            'manufacture_date',
            'expiry_date',
            'serial_number',
            'warranty_expires',
            'notes',
        ];
    }

    public function array(): array
    {
        return [
            [
                'Main Branch',
                '2026-06-01',
                'SMP-001',
                '',
                '',
                '',
                100,
                5.00,
                '',
                '',
                '',
                '',
                '',
                '',
            ],
            [
                'Main Branch',
                '2026-06-01',
                '',
                'Sample Product Name',
                '',
                '',
                50,
                4.50,
                '',
                '',
                '',
                '',
                '',
                '',
            ],
            [
                'Main Branch',
                '2026-06-01',
                'VAR-001',
                '',
                'VAR-001-RED',
                '',
                25,
                6.00,
                '',
                '',
                '',
                '',
                '',
                '',
            ],
            [
                'Main Branch',
                '2026-06-01',
                'LOT-001',
                '',
                '',
                '',
                200,
                3.00,
                'LOT-2026-001',
                '2026-01-15',
                '2027-01-15',
                '',
                '',
                '',
            ],
            [
                'Main Branch',
                '2026-06-01',
                'SER-001',
                '',
                '',
                '',
                1,
                10.00,
                '',
                '',
                '',
                'SER-100001',
                '2028-06-09',
                '',
            ],
        ];
    }

    public function map(mixed $row): array
    {
        return $row;
    }
}
