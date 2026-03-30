<?php

namespace App\Policies;

use App\Models\StockLot;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class LotPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockLot $stockLot): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $stockLot)
            && $user->hasBranchAccess($stockLot->warehouse?->branch_id);
    }

    public function updateStatus(User $user, StockLot $stockLot): bool
    {
        return $user->can('inventory.adjust')
            && $this->belongsToSameBusiness($user, $stockLot)
            && $user->hasBranchAccess($stockLot->warehouse?->branch_id);
    }
}
