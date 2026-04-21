<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class BranchAccess
{
    public static function accessibleBranchIds(?User $user): ?array
    {
        if (! $user instanceof User) {
            if (! app()->bound('branch_scope')) {
                return null;
            }

            $branchScope = app('branch_scope');

            return is_array($branchScope) ? $branchScope : null;
        }

        if ($user->hasRole(['super_admin', 'admin'])) {
            return null;
        }

        $requestUser = request()?->user();

        if ($requestUser instanceof User && $requestUser->is($user) && app()->bound('branch_scope')) {
            $branchScope = app('branch_scope');

            return is_array($branchScope) ? $branchScope : null;
        }

        return $user->accessibleBranchIds();
    }

    public static function scopeBranchQuery(Builder $query, User|array|null $userOrBranchIds, string $column = 'id'): Builder
    {
        if ($userOrBranchIds instanceof User) {
            $userOrBranchIds = static::accessibleBranchIds($userOrBranchIds);
        }

        $branchIds = $userOrBranchIds === null
            ? null
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
