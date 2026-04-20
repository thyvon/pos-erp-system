<?php

namespace App\Support\Accounting;

use App\Models\ChartOfAccount;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class DefaultChartOfAccounts
{
    public static function definitions(): array
    {
        return [
            ['code' => '1000', 'name' => 'Assets', 'type' => 'asset', 'sub_type' => 'header', 'normal_balance' => 'debit', 'parent_code' => null, 'is_system' => true],
            ['code' => '1100', 'name' => 'Cash and Cash Equivalents', 'type' => 'asset', 'sub_type' => 'header', 'normal_balance' => 'debit', 'parent_code' => '1000', 'is_system' => true],
            ['code' => '1110', 'name' => 'Cash On Hand', 'type' => 'asset', 'sub_type' => 'cash', 'normal_balance' => 'debit', 'parent_code' => '1100', 'is_system' => true],
            ['code' => '1120', 'name' => 'Bank Account', 'type' => 'asset', 'sub_type' => 'bank', 'normal_balance' => 'debit', 'parent_code' => '1100', 'is_system' => true],
            ['code' => '1200', 'name' => 'Accounts Receivable', 'type' => 'asset', 'sub_type' => 'receivable', 'normal_balance' => 'debit', 'parent_code' => '1000', 'is_system' => true],
            ['code' => '1300', 'name' => 'Inventory Asset', 'type' => 'asset', 'sub_type' => 'inventory', 'normal_balance' => 'debit', 'parent_code' => '1000', 'is_system' => true],
            ['code' => '2000', 'name' => 'Liabilities', 'type' => 'liability', 'sub_type' => 'header', 'normal_balance' => 'credit', 'parent_code' => null, 'is_system' => true],
            ['code' => '2100', 'name' => 'Accounts Payable', 'type' => 'liability', 'sub_type' => 'payable', 'normal_balance' => 'credit', 'parent_code' => '2000', 'is_system' => true],
            ['code' => '2200', 'name' => 'Tax Payable', 'type' => 'liability', 'sub_type' => 'tax', 'normal_balance' => 'credit', 'parent_code' => '2000', 'is_system' => true],
            ['code' => '3000', 'name' => 'Equity', 'type' => 'equity', 'sub_type' => 'header', 'normal_balance' => 'credit', 'parent_code' => null, 'is_system' => true],
            ['code' => '3100', 'name' => 'Owner Capital', 'type' => 'equity', 'sub_type' => 'capital', 'normal_balance' => 'credit', 'parent_code' => '3000', 'is_system' => true],
            ['code' => '4000', 'name' => 'Revenue', 'type' => 'revenue', 'sub_type' => 'header', 'normal_balance' => 'credit', 'parent_code' => null, 'is_system' => true],
            ['code' => '4100', 'name' => 'Sales Revenue', 'type' => 'revenue', 'sub_type' => 'sales', 'normal_balance' => 'credit', 'parent_code' => '4000', 'is_system' => true],
            ['code' => '5000', 'name' => 'Cost of Sales', 'type' => 'expense', 'sub_type' => 'header', 'normal_balance' => 'debit', 'parent_code' => null, 'is_system' => true],
            ['code' => '5100', 'name' => 'Cost of Goods Sold', 'type' => 'expense', 'sub_type' => 'cogs', 'normal_balance' => 'debit', 'parent_code' => '5000', 'is_system' => true],
            ['code' => '6000', 'name' => 'Operating Expenses', 'type' => 'expense', 'sub_type' => 'header', 'normal_balance' => 'debit', 'parent_code' => null, 'is_system' => true],
            ['code' => '6100', 'name' => 'Utilities Expense', 'type' => 'expense', 'sub_type' => 'utilities', 'normal_balance' => 'debit', 'parent_code' => '6000', 'is_system' => true],
            ['code' => '6200', 'name' => 'Rent Expense', 'type' => 'expense', 'sub_type' => 'rent', 'normal_balance' => 'debit', 'parent_code' => '6000', 'is_system' => true],
        ];
    }

    public static function seedBusiness(string $businessId): void
    {
        if (! Schema::hasTable('chart_of_accounts')) {
            return;
        }

        if (ChartOfAccount::withoutGlobalScopes()->where('business_id', $businessId)->exists()) {
            return;
        }

        $accountsByCode = [];

        foreach (self::definitions() as $definition) {
            $parentId = null;

            if ($definition['parent_code']) {
                $parentId = $accountsByCode[$definition['parent_code']]->id ?? null;
            }

            $account = ChartOfAccount::withoutGlobalScopes()->create([
                'id' => (string) Str::uuid(),
                'business_id' => $businessId,
                'parent_id' => $parentId,
                'code' => $definition['code'],
                'name' => $definition['name'],
                'type' => $definition['type'],
                'sub_type' => $definition['sub_type'],
                'normal_balance' => $definition['normal_balance'],
                'is_system' => $definition['is_system'],
                'is_active' => true,
            ]);

            $accountsByCode[$definition['code']] = $account;
        }
    }
}
