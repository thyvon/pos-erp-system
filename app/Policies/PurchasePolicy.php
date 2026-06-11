<?php

namespace App\Policies;

use App\Models\Purchase;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;
use App\Services\Foundation\EditWindowService;
use Carbon\CarbonInterface;

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
            && $this->isWithinEditWindow($purchase)
            && in_array($purchase->status, ['draft', 'confirmed', 'partially_received'], true);
    }

    protected function isWithinEditWindow(Purchase $purchase): bool
    {
        $referenceDate = $purchase->purchase_date instanceof CarbonInterface
            ? $purchase->purchase_date->copy()->startOfDay()
            : $purchase->created_at?->copy()->startOfDay();

        return app(EditWindowService::class)->isWithinWindow(
            $referenceDate,
            'purchases',
            'purchase_edit_lifetime_days',
        );
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

    public function manageReceives(User $user, Purchase $purchase): bool
    {
        return $user->can('purchases.receive')
            && $this->belongsToSameBusiness($user, $purchase)
            && $user->hasBranchAccess($purchase->branch_id)
            && in_array($purchase->status, ['confirmed', 'partially_received', 'received'], true);
    }

    public function recordPayment(User $user, Purchase $purchase): bool
    {
        return $user->can('payments.create')
            && $this->belongsToSameBusiness($user, $purchase)
            && $user->hasBranchAccess($purchase->branch_id)
            && in_array($purchase->status, ['confirmed', 'partially_received', 'received'], true)
            && in_array($purchase->payment_status, ['unpaid', 'partial'], true);
    }

    public function updatePayment(User $user, Purchase $purchase): bool
    {
        return $user->can('payments.edit')
            && $this->belongsToSameBusiness($user, $purchase)
            && $user->hasBranchAccess($purchase->branch_id)
            && in_array($purchase->status, ['confirmed', 'partially_received', 'received'], true)
            && in_array($purchase->payment_status, ['partial', 'paid'], true);
    }

    public function deletePayment(User $user, Purchase $purchase): bool
    {
        return $user->can('payments.delete')
            && $this->belongsToSameBusiness($user, $purchase)
            && $user->hasBranchAccess($purchase->branch_id)
            && in_array($purchase->status, ['confirmed', 'partially_received', 'received'], true)
            && in_array($purchase->payment_status, ['partial', 'paid'], true);
    }
}
