<?php

namespace App\Policies;

use App\Models\Purchase;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class PurchasePolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('purchases.index');
    }

    public function view(User $user, Purchase $purchase): bool
    {
        return $user->can('purchases.index')
            && $this->belongsToSameBusiness($user, $purchase)
            && $user->hasBranchAccess($purchase->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('purchases.create');
    }

    public function update(User $user, Purchase $purchase): bool
    {
        return $user->can('purchases.edit')
            && $this->belongsToSameBusiness($user, $purchase)
            && $user->hasBranchAccess($purchase->branch_id)
            && in_array($purchase->status, ['draft', 'confirmed'], true);
    }

    public function delete(User $user, Purchase $purchase): bool
    {
        return $user->can('purchases.delete')
            && $this->belongsToSameBusiness($user, $purchase)
            && $user->hasBranchAccess($purchase->branch_id)
            && in_array($purchase->status, ['draft', 'confirmed', 'cancelled'], true);
    }

    public function receive(User $user, Purchase $purchase): bool
    {
        return $user->can('purchases.receive')
            && $this->belongsToSameBusiness($user, $purchase)
            && $user->hasBranchAccess($purchase->branch_id)
            && in_array($purchase->status, ['confirmed', 'partially_received'], true);
    }
}
