<?php

namespace App\Policies;

use App\Models\StockLevel;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class StockLevelPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockLevel $stockLevel): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $stockLevel)
            && $user->hasWarehouseAccess($stockLevel->warehouse_id);
    }
}
