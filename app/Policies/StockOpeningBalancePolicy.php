<?php

namespace App\Policies;

use App\Models\StockOpeningBalance;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class StockOpeningBalancePolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockOpeningBalance $openingBalance): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $openingBalance)
            && $user->hasWarehouseAccess($openingBalance->warehouse_id);
    }

    public function create(User $user): bool
    {
        return $user->can('inventory.adjust');
    }
}
