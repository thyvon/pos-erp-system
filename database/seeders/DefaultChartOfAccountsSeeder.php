<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Support\Accounting\DefaultChartOfAccounts;
use Illuminate\Database\Seeder;

class DefaultChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        Business::withoutGlobalScopes()
            ->select('id')
            ->cursor()
            ->each(fn (Business $business) => DefaultChartOfAccounts::seedBusiness($business->id));
    }
}
