<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

class UserTemplateExport implements FromArray, WithHeadings, WithMapping, WithStrictNullComparison
{
    public function headings(): array
    {
        return [
            'first_name',
            'last_name',
            'email',
            'password',
            'phone',
            'status',
            'max_discount',
            'commission_percentage',
            'sales_target_amount',
            'role',
            'roles',
            'direct_permissions',
            'branch_ids',
            'default_branch_id',
        ];
    }

    public function array(): array
    {
        return [
            [
                'John',
                'Doe',
                'john.doe@example.com',
                '',
                '+85512345678',
                'active',
                '50',
                '5',
                '10000',
                'Cashier',
                '',
                'sales.create,sales.edit',
                'Main Branch',
                'Main Branch',
            ],
            [
                'Jane',
                'Smith',
                'jane.smith@example.com',
                '',
                '',
                'active',
                '',
                '',
                '',
                'Manager',
                '',
                'reports.view,settings.edit',
                'Main Branch',
                '',
            ],
            [
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
            ],
        ];
    }

    public function map(mixed $row): array
    {
        return $row;
    }
}
