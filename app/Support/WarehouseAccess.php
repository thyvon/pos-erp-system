<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class WarehouseAccess
{
    public static function accessibleWarehouseIds(?User $user): ?array
    {
        if (! $user instanceof User) {
            if (! app()->bound('warehouse_scope')) {
                return null;
            }

            $warehouseScope = app('warehouse_scope');

            return is_array($warehouseScope) ? $warehouseScope : null;
        }

        $requestUser = request()?->user();

        if ($requestUser instanceof User && $requestUser->is($user) && app()->bound('warehouse_scope')) {
            $warehouseScope = app('warehouse_scope');

            return is_array($warehouseScope) ? $warehouseScope : null;
        }

        return $user->assignedWarehouseIds();
    }

    public static function scopeWarehouseQuery(Builder $query, User|array|null $userOrWarehouseIds, string $column = 'id'): Builder
    {
        if ($userOrWarehouseIds instanceof User) {
            $userOrWarehouseIds = static::accessibleWarehouseIds($userOrWarehouseIds);
        }

        $warehouseIds = $userOrWarehouseIds === null
            ? null
            : array_values(array_unique($userOrWarehouseIds));

        if ($warehouseIds === null) {
            return $query;
        }

        if ($warehouseIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn($column, $warehouseIds);
    }
}
