<?php

namespace App\Policies;

use App\Models\StockAdjustment;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class StockAdjustmentPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockAdjustment $adjustment): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $adjustment)
            && $user->hasBranchAccess($adjustment->warehouse?->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('inventory.adjust');
    }
}
