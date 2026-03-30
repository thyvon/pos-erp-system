<?php

namespace App\Policies;

use App\Models\StockSerial;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class SerialPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockSerial $stockSerial): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $stockSerial)
            && $user->hasBranchAccess($stockSerial->warehouse?->branch_id);
    }

    public function writeOff(User $user, StockSerial $stockSerial): bool
    {
        return $user->can('inventory.adjust')
            && $this->belongsToSameBusiness($user, $stockSerial)
            && $user->hasBranchAccess($stockSerial->warehouse?->branch_id);
    }
}
