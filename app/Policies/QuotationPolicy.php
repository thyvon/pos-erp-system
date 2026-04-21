<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class QuotationPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('sales.index');
    }

    public function view(User $user, Sale $sale): bool
    {
        return $sale->type === 'quotation'
            && $user->can('sales.index')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('sales.create');
    }

    public function update(User $user, Sale $sale): bool
    {
        return $sale->type === 'quotation'
            && $user->can('sales.edit')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id);
    }

    public function convert(User $user, Sale $sale): bool
    {
        return $sale->type === 'quotation'
            && $sale->status === 'quotation'
            && $user->can('sales.create')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id);
    }

    public function cancel(User $user, Sale $sale): bool
    {
        return $sale->type === 'quotation'
            && $sale->status === 'quotation'
            && $user->can('sales.cancel')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id);
    }
}
