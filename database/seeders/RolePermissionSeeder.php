<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        config([
            'cache.default' => 'array',
            'permission.cache.store' => 'array',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = $this->permissionNames();

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        Permission::query()
            ->where('guard_name', 'web')
            ->whereNotIn('name', $permissions)
            ->delete();

        $roles = $this->rolePermissionMap($permissions);

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            $role->syncPermissions($rolePermissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    protected function permissionNames(): array
    {
        return [
            'roles.index',
            'roles.create',
            'roles.edit',
            'roles.delete',

            'users.index',
            'users.create',
            'users.edit',
            'users.delete',

            'branches.index',
            'branches.create',
            'branches.edit',
            'branches.delete',

            'warehouses.index',
            'warehouses.create',
            'warehouses.edit',
            'warehouses.delete',

            'businesses.index',
            'businesses.create',
            'businesses.edit',
            'businesses.delete',

            'custom_fields.index',
            'custom_fields.create',
            'custom_fields.edit',
            'custom_fields.delete',

            'settings.index',
            'settings.edit',

            'products.index',
            'products.create',
            'products.edit',
            'products.delete',
            'products.export',

            'customers.index',
            'customers.create',
            'customers.edit',
            'customers.delete',
            'customers.export',

            'suppliers.index',
            'suppliers.create',
            'suppliers.edit',
            'suppliers.delete',
            'suppliers.export',

            'sales.index',
            'sales.create',
            'sales.edit',
            'sales.delete',
            'sales.confirm',
            'sales.complete',
            'sales.cancel',
            'sales.return',
            'sales.export',

            'purchases.index',
            'purchases.create',
            'purchases.edit',
            'purchases.delete',
            'purchases.receive',
            'purchases.return',
            'purchases.export',

            'inventory.index',
            'inventory.adjust',
            'inventory.transfer',
            'inventory.count',
            'inventory.export',

            'accounting.index',
            'accounting.journals',
            'accounting.coa',

            'payments.index',
            'payments.create',
            'payments.edit',
            'payments.delete',
            'payments.export',

            'expenses.index',
            'expenses.create',
            'expenses.edit',
            'expenses.delete',
            'expenses.export',

            'reports.index',
            'reports.financial',
            'reports.own_only',
            'reports.export',

            'loyalty.index',
            'loyalty.create',
            'loyalty.edit',
            'loyalty.delete',

            'commissions.index',
            'commissions.create',
            'commissions.edit',
            'commissions.delete',
            'commissions.export',

            'crm.index',
            'crm.create',
            'crm.edit',
            'crm.delete',
            'crm.export',

            'gift_cards.index',
            'gift_cards.create',
            'gift_cards.edit',
            'gift_cards.delete',
            'gift_cards.export',

            'manufacturing.index',
            'manufacturing.create',
            'manufacturing.edit',
            'manufacturing.delete',
            'manufacturing.export',

            'asset_management.index',
            'asset_management.create',
            'asset_management.edit',
            'asset_management.delete',
            'asset_management.export',

            'installments.index',
            'installments.create',
            'installments.edit',
            'installments.delete',
            'installments.export',

            'hrm.index',
            'hrm.manage',
            'hrm.payroll',
            'hrm.export',
        ];
    }

    protected function rolePermissionMap(array $permissions): array
    {
        $platformOnlyPermissions = [
            'businesses.create',
            'businesses.delete',
        ];

        return [
            'super_admin' => $permissions,
            'admin' => array_values(array_diff($permissions, $platformOnlyPermissions)),
            'manager' => [
                'users.index',
                'branches.index',
                'warehouses.index',
                'products.index',
                'products.create',
                'products.edit',
                'customers.index',
                'customers.create',
                'customers.edit',
                'suppliers.index',
                'suppliers.create',
                'suppliers.edit',
                'sales.index',
                'sales.create',
                'sales.edit',
                'sales.confirm',
                'sales.complete',
                'sales.cancel',
                'sales.return',
                'purchases.index',
                'purchases.create',
                'purchases.edit',
                'purchases.receive',
                'purchases.return',
                'inventory.index',
                'inventory.adjust',
                'inventory.transfer',
                'inventory.count',
                'payments.index',
                'payments.create',
                'expenses.index',
                'expenses.create',
                'expenses.edit',
                'reports.index',
                'reports.export',
                'reports.own_only',
                'loyalty.index',
                'loyalty.create',
                'loyalty.edit',
                'commissions.index',
                'commissions.export',
                'crm.index',
                'crm.create',
                'crm.edit',
                'gift_cards.index',
                'gift_cards.create',
                'gift_cards.edit',
                'manufacturing.index',
                'manufacturing.create',
                'manufacturing.edit',
                'asset_management.index',
                'asset_management.create',
                'asset_management.edit',
                'installments.index',
                'installments.create',
                'installments.edit',
                'hrm.index',
            ],
            'cashier' => [
                'products.index',
                'customers.index',
                'customers.create',
                'sales.index',
                'sales.create',
                'sales.confirm',
                'sales.complete',
                'payments.index',
                'payments.create',
                'reports.index',
                'reports.own_only',
                'loyalty.index',
                'gift_cards.index',
            ],
            'accountant' => [
                'suppliers.index',
                'sales.index',
                'purchases.index',
                'accounting.index',
                'accounting.journals',
                'accounting.coa',
                'payments.index',
                'payments.create',
                'payments.edit',
                'payments.delete',
                'payments.export',
                'expenses.index',
                'expenses.create',
                'expenses.edit',
                'reports.index',
                'reports.financial',
                'reports.export',
                'reports.own_only',
                'hrm.payroll',
            ],
            'inventory_manager' => [
                'warehouses.index',
                'products.index',
                'products.create',
                'products.edit',
                'suppliers.index',
                'suppliers.create',
                'suppliers.edit',
                'purchases.index',
                'purchases.create',
                'purchases.edit',
                'purchases.receive',
                'purchases.return',
                'inventory.index',
                'inventory.adjust',
                'inventory.transfer',
                'inventory.count',
                'inventory.export',
                'reports.index',
                'reports.own_only',
                'manufacturing.index',
                'manufacturing.create',
                'manufacturing.edit',
            ],
            'sales_representative' => [
                'products.index',
                'customers.index',
                'customers.create',
                'customers.edit',
                'sales.index',
                'sales.create',
                'sales.edit',
                'sales.confirm',
                'sales.complete',
                'reports.index',
                'reports.own_only',
                'commissions.index',
                'crm.index',
                'crm.create',
                'crm.edit',
            ],
        ];
    }
}
