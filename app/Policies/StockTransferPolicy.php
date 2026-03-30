<?php

namespace App\Policies;

use App\Models\StockTransfer;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class StockTransferPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockTransfer $transfer): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $transfer)
            && (
                $user->hasBranchAccess($transfer->fromWarehouse?->branch_id)
                || $user->hasBranchAccess($transfer->toWarehouse?->branch_id)
            );
    }

    public function create(User $user): bool
    {
        return $user->can('inventory.transfer');
    }
}
