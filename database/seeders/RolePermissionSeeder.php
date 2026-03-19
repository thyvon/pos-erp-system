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
            'products',
            'customers',
            'suppliers',
            'sales',
            'purchases',
            'inventory',
            'accounting',
            'expenses',
            'reports',
            'settings',
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
                    ->orWhere('name', 'like', 'reports.%')
                    ->orWhere('name', 'like', 'expenses.%');
            })->get(),
            'hr' => Permission::where('name', 'like', 'hrm.%')->get(),
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
