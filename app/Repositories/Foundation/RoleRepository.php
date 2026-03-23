<?php

namespace App\Repositories\Foundation;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleRepository
{
    public function __construct(protected Role $model)
    {
    }

    public function paginateFiltered(array $filters, ?string $businessId = null): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));
        $modelHasRolesTable = config('permission.table_names.model_has_roles', 'model_has_roles');
        $usersTable = (new User())->getTable();

        $usersCountSubquery = DB::table($modelHasRolesTable)
            ->join($usersTable, "{$usersTable}.id", '=', "{$modelHasRolesTable}.model_id")
            ->selectRaw('COUNT(*)')
            ->whereColumn("{$modelHasRolesTable}.role_id", 'roles.id')
            ->where("{$modelHasRolesTable}.model_type", User::class);

        if ($businessId !== null) {
            $usersCountSubquery->where("{$usersTable}.business_id", $businessId);
        }

        return $this->model->newQuery()
            ->where('guard_name', 'web')
            ->where('name', '!=', 'super_admin')
            ->with('permissions:name')
            ->select('roles.*')
            ->selectSub($usersCountSubquery, 'users_count')
            ->when(
                filled($filters['search'] ?? null),
                fn ($query) => $query->where('name', 'like', '%'.trim((string) $filters['search']).'%')
            )
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): Role
    {
        /** @var Role $role */
        $role = $this->model->newQuery()->create($attributes);

        return $role;
    }

    public function update(Role $role, array $attributes): Role
    {
        $role->fill($attributes);
        $role->save();

        return $role->refresh();
    }

    public function delete(Role $role): ?bool
    {
        return $role->delete();
    }

    public function permissionGroups(): array
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
