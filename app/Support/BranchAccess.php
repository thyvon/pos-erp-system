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
        if ($userOrBranchIds instanceof User) {
            if ($userOrBranchIds->hasRole('super_admin')) {
                return $query;
            }

            $qualifiedColumn = str_contains($column, '.')
                ? $column
                : $query->qualifyColumn($column);

            return $query->whereExists(function ($subQuery) use ($qualifiedColumn, $userOrBranchIds): void {
                $subQuery
                    ->selectRaw('1')
                    ->from('branch_user')
                    ->where('branch_user.user_id', $userOrBranchIds->getKey())
                    ->whereColumn('branch_user.branch_id', $qualifiedColumn);
            });
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
