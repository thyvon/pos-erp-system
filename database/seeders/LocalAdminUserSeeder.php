<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LocalAdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $business = Business::firstOrCreate(
            ['email' => 'erp@example.com'],
            [
                'name' => 'ERP Demo Business',
                'legal_name' => 'ERP Demo Business Co., Ltd.',
                'phone' => '012345678',
                'currency' => 'USD',
                'timezone' => 'Asia/Phnom_Penh',
                'country' => 'KH',
                'address' => [
                    'line1' => 'Phnom Penh',
                    'city' => 'Phnom Penh',
                    'country' => 'Cambodia',
                ],
                'tier' => 'standard',
                'status' => 'active',
                'max_users' => 25,
                'max_branches' => 5,
                'financial_year' => [
                    'start_month' => 1,
                    'start_day' => 1,
                ],
                'settings_cache' => [],
            ]
        );

        $user = User::withTrashed()->firstOrNew(['email' => 'admin@example.com']);

        $user->fill([
            'business_id' => $business->id,
            'first_name' => 'System',
            'last_name' => 'Admin',
            'password' => Hash::make('password'),
            'phone' => '012345678',
            'status' => 'active',
            'max_discount' => 100,
            'preferences' => [
                'locale' => 'en',
                'timezone' => 'Asia/Phnom_Penh',
            ],
        ]);

        $user->deleted_at = null;
        $user->save();
        $user->syncRoles(['admin']);

        $this->call(DefaultSettingsSeeder::class);
    }
}
