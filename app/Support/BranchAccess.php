<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class BranchAccess
{
    public static function accessibleBranchIds(?User $user): ?array
    {
        if (! $user instanceof User || $user->hasRole('super_admin')) {
            return null;
        }

        return $user->accessibleBranchIds();
    }

    public static function scopeBranchQuery(Builder $query, User|array|null $userOrBranchIds, string $column = 'id'): Builder
    {
        $branchIds = $userOrBranchIds instanceof User || $userOrBranchIds === null
            ? static::accessibleBranchIds($userOrBranchIds)
            : array_values(array_unique($userOrBranchIds));

        if ($branchIds === null) {
            return $query;
        }

        if ($branchIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn($column, $branchIds);
    }
}
