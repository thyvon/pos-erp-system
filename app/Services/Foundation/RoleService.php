<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\User;
use App\Repositories\Foundation\RoleRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleService
{
    protected const PROTECTED_ROLE_NAMES = [
        'super_admin',
        'admin',
        'manager',
        'cashier',
        'accountant',
        'inventory_manager',
        'sales_representative',
    ];

    public function __construct(protected RoleRepository $roles)
    {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->roles->paginateFiltered($filters, $this->currentBusinessId());
    }

    public function create(array $data): Role
    {
        $permissions = array_values(array_unique($data['permissions'] ?? []));
        unset($data['permissions']);

        $this->ensureRoleNameIsAllowed($data['name']);
        $data['guard_name'] = 'web';

        return DB::transaction(function () use ($data, $permissions): Role {
            $role = $this->roles->create($data);
            $role->syncPermissions($permissions);

            return $role->load('permissions');
        });
    }

    public function update(Role $role, array $data): Role
    {
        $permissions = array_values(array_unique($data['permissions'] ?? []));
        unset($data['permissions']);

        if (array_key_exists('name', $data) && $data['name'] !== $role->name && $this->isProtected($role)) {
            throw new DomainException('Protected system roles cannot be renamed.', 422);
        }

        if (array_key_exists('name', $data)) {
            $this->ensureRoleNameIsAllowed($data['name']);
        }

        return DB::transaction(function () use ($role, $data, $permissions): Role {
            $updatedRole = empty($data) ? $role->refresh() : $this->roles->update($role, $data);
            $updatedRole->syncPermissions($permissions);

            return $updatedRole->load('permissions');
        });
    }

    public function delete(Role $role): void
    {
        if ($this->isProtected($role)) {
            throw new DomainException('Protected system roles cannot be deleted.', 422);
        }

        if ($this->hasAssignedUsersAnywhere($role)) {
            throw new DomainException('This role cannot be deleted because users are still assigned to it.', 422);
        }

        $this->roles->delete($role);
    }

    public function options(): array
    {
        return [
            'permissions' => $this->roles->permissionGroups(),
        ];
    }

    public static function protectedRoleNames(): array
    {
        return self::PROTECTED_ROLE_NAMES;
    }

    protected function isProtected(Role $role): bool
    {
        return in_array($role->name, self::PROTECTED_ROLE_NAMES, true);
    }

    protected function ensureRoleNameIsAllowed(string $name): void
    {
        if (strtolower($name) === 'super_admin') {
            throw new DomainException('The super_admin role can only be assigned through seeders.', 422);
        }
    }

    protected function hasAssignedUsersAnywhere(Role $role): bool
    {
        $modelHasRolesTable = config('permission.table_names.model_has_roles', 'model_has_roles');

        return DB::table($modelHasRolesTable)
            ->where('role_id', $role->id)
            ->where('model_type', User::class)
            ->exists();
    }

    protected function currentBusinessId(): ?string
    {
        if (app()->bound('tenant')) {
            return app('tenant')?->id;
        }

        return auth()->user()?->business_id;
    }
}
