<?php

namespace App\Policies;

use App\Models\SaleReturn;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class SaleReturnPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('sales.return');
    }

    public function view(User $user, SaleReturn $saleReturn): bool
    {
        return $user->can('sales.return')
            && $this->belongsToSameBusiness($user, $saleReturn)
            && $user->hasBranchAccess($saleReturn->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('sales.return');
    }
}
