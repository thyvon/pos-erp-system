<?php

namespace App\Repositories\Foundation;

use App\Models\User;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserRepository extends BaseRepository
{
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->query()
            ->where('email', $email)
            ->first();
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->with(['business', 'roles', 'permissions', 'branches', 'defaultBranch'])
            ->whereDoesntHave('roles', fn ($roleQuery) => $roleQuery->where('name', 'super_admin'))
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($userQuery) use ($search): void {
                        $userQuery
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['role'] ?? null),
                fn ($query) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', $filters['role']))
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function availableRoles(): array
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->where('name', '!=', 'super_admin')
            ->with('permissions:name')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->values(),
            ])
            ->all();
    }

    public function availablePermissions(): array
    {
        return Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['name'])
            ->groupBy(fn ($permission) => str($permission->name)->before('.')->value())
            ->map(fn ($permissions, $group) => [
                'group' => $group,
                'permissions' => $permissions->pluck('name')->values(),
            ])
            ->values()
            ->all();
    }
}
