<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $resources = [
            'users',
            'branches',
            'warehouses',
            'businesses',
            'products',
            'customers',
            'suppliers',
            'sales',
            'purchases',
            'inventory',
            'accounting',
            'payments',
            'expenses',
            'reports',
            'settings',
            'loyalty',
            'commissions',
            'crm',
            'gift_cards',
            'manufacturing',
            'asset_management',
            'installments',
            'hrm',
        ];

        $actions = ['index', 'create', 'edit', 'delete', 'export'];

        $permissions = collect($resources)
            ->flatMap(fn (string $resource) => collect($actions)
                ->map(fn (string $action) => $resource.'.'.$action))
            ->values();

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        $roles = [
            'super_admin' => Permission::all(),
            'admin' => Permission::all(),
            'manager' => Permission::whereNotIn('name', [
                'settings.edit',
                'settings.delete',
                'accounting.delete',
            ])->get(),
            'cashier' => Permission::whereIn('name', [
                'sales.index',
                'sales.create',
                'sales.edit',
                'customers.index',
                'customers.create',
                'products.index',
                'inventory.index',
            ])->get(),
            'accountant' => Permission::where(function ($query): void {
                $query->where('name', 'like', 'accounting.%')
                    ->orWhere('name', 'like', 'payments.%')
                    ->orWhere('name', 'like', 'reports.%')
                    ->orWhere('name', 'like', 'expenses.%');
            })->get(),
            'inventory_manager' => Permission::where(function ($query): void {
                $query->where('name', 'like', 'inventory.%')
                    ->orWhere('name', 'like', 'products.%')
                    ->orWhere('name', 'like', 'purchases.%')
                    ->orWhere('name', 'like', 'suppliers.%')
                    ->orWhere('name', 'like', 'warehouses.%');
            })->get(),
            'sales_representative' => Permission::whereIn('name', [
                'sales.index',
                'sales.create',
                'sales.edit',
                'customers.index',
                'products.index',
                'reports.index',
            ])->get(),
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            $role->syncPermissions($rolePermissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
