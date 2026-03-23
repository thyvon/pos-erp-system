<?php

namespace Database\Seeders;

use App\Support\Foundation\DefaultSettings;
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
        foreach ($businessIds as $businessId) {
            DefaultSettings::seedBusiness($businessId);
        }
    }
}
