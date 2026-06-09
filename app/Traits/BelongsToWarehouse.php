<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToWarehouse
{
    protected static function bootBelongsToWarehouse(): void
    {
        static::addGlobalScope('warehouse', function (Builder $builder): void {
            $warehouseIds = static::resolveWarehouseScope();

            if ($warehouseIds === null) {
                return;
            }

            if ($warehouseIds === []) {
                $builder->whereRaw('1 = 0');

                return;
            }

            $builder->whereIn($builder->qualifyColumn('warehouse_id'), $warehouseIds);
        });
    }

    protected static function resolveWarehouseScope(): ?array
    {
        if (! app()->bound('warehouse_scope')) {
            return null;
        }

        $warehouseScope = app('warehouse_scope');

        return is_array($warehouseScope) ? $warehouseScope : null;
    }
}
