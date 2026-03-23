<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class BranchAccess
{
    public static function scopeBranchQuery(Builder $query, ?User $user, string $column = 'id'): Builder
    {
        if (! $user instanceof User || $user->hasRole('super_admin')) {
            return $query;
        }

        $branchIds = $user->accessibleBranchIds();

        if ($branchIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn($column, $branchIds);
    }
}
