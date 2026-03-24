<?php

namespace Database\Seeders;

use App\Models\Branch;
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
                'timezone' => 'UTC',
                'country' => 'KH',
                'locale' => 'en',
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

        $branchIds = Branch::query()
            ->where('business_id', $business->id)
            ->pluck('id')
            ->all();

        $this->createOrUpdateUser(
            business: $business,
            branchIds: $branchIds,
            email: 'admin@example.com',
            firstName: 'Business',
            lastName: 'Admin',
            role: 'admin'
        );

        $this->createOrUpdateUser(
            business: $business,
            branchIds: $branchIds,
            email: 'superadmin@example.com',
            firstName: 'System',
            lastName: 'Super Admin',
            role: 'super_admin'
        );

        $this->call(DefaultSettingsSeeder::class);
    }

    protected function createOrUpdateUser(
        Business $business,
        array $branchIds,
        string $email,
        string $firstName,
        string $lastName,
        string $role
    ): void {
        $user = User::withTrashed()->firstOrNew(['email' => $email]);

        $user->fill([
            'business_id' => $business->id,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'password' => Hash::make('password'),
            'phone' => '012345678',
            'status' => 'active',
            'max_discount' => 100,
            'commission_percentage' => 0,
            'sales_target_amount' => 0,
            'preferences' => [
                'locale' => 'en',
                'timezone' => 'UTC',
            ],
        ]);

        $user->deleted_at = null;
        $user->save();
        $user->syncRoles([$role]);

        if ($branchIds === []) {
            $user->forceFill(['default_branch_id' => null])->save();
            return;
        }

        $user->branches()->sync($branchIds);
        $user->forceFill([
            'default_branch_id' => $branchIds[0],
        ])->save();
    }
}
