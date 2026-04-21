<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToBranch
{
    protected static function bootBelongsToBranch(): void
    {
        static::addGlobalScope('branch', function (Builder $builder): void {
            $branchIds = static::resolveBranchScope();

            if ($branchIds === null) {
                return;
            }

            if ($branchIds === []) {
                $builder->whereRaw('1 = 0');

                return;
            }

            $builder->whereIn($builder->qualifyColumn('branch_id'), $branchIds);
        });
    }

    protected static function resolveBranchScope(): ?array
    {
        if (! app()->bound('branch_scope')) {
            return null;
        }

        $branchScope = app('branch_scope');

        return is_array($branchScope) ? $branchScope : null;
    }
}
