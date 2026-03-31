<?php

namespace App\Policies;

use App\Models\StockCount;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class StockCountPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockCount $stockCount): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $stockCount)
            && $user->hasBranchAccess($stockCount->warehouse?->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('inventory.count');
    }

    public function complete(User $user, StockCount $stockCount): bool
    {
        return $user->can('inventory.count')
            && $this->belongsToSameBusiness($user, $stockCount)
            && $user->hasBranchAccess($stockCount->warehouse?->branch_id)
            && $stockCount->status === 'in_progress';
    }

    public function record(User $user, StockCount $stockCount): bool
    {
        return $user->can('inventory.count')
            && $this->belongsToSameBusiness($user, $stockCount)
            && $user->hasBranchAccess($stockCount->warehouse?->branch_id)
            && $stockCount->status === 'in_progress';
    }
}
