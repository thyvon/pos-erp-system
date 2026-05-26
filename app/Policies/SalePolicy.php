<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;
use App\Services\Foundation\EditWindowService;
use Carbon\CarbonInterface;

class SalePolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('sales.index');
    }

    public function view(User $user, Sale $sale): bool
    {
        return $user->can('sales.index')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('sales.create');
    }

    public function update(User $user, Sale $sale): bool
    {
        return $user->can('sales.edit')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && $this->isWithinEditWindow($sale);
    }

    public function delete(User $user, Sale $sale): bool
    {
        return $user->can('sales.delete')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && $this->isEditableSale($sale);
    }

    public function confirm(User $user, Sale $sale): bool
    {
        return $user->can('sales.confirm')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && in_array($sale->status, ['draft', 'suspended'], true);
    }

    public function complete(User $user, Sale $sale): bool
    {
        return $user->can('sales.complete')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && in_array($sale->status, ['draft', 'suspended', 'confirmed'], true);
    }

    public function cancel(User $user, Sale $sale): bool
    {
        return $user->can('sales.cancel')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && in_array($sale->status, ['draft', 'quotation', 'suspended', 'confirmed'], true);
    }

    public function recordPayment(User $user, Sale $sale): bool
    {
        return $user->can('payments.create')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && $sale->status === 'completed'
            && in_array($sale->payment_status, ['unpaid', 'partial'], true);
    }

    public function updatePayment(User $user, Sale $sale): bool
    {
        return $user->can('payments.edit')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && $sale->status === 'completed'
            && in_array($sale->payment_status, ['partial', 'paid'], true);
    }

    public function deletePayment(User $user, Sale $sale): bool
    {
        return $user->can('payments.delete')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && $sale->status === 'completed'
            && in_array($sale->payment_status, ['partial', 'paid'], true);
    }

    public function recordReturn(User $user, Sale $sale): bool
    {
        return $user->can('sales.return')
            && $this->belongsToSameBusiness($user, $sale)
            && $user->hasBranchAccess($sale->branch_id)
            && in_array($sale->status, ['completed', 'returned'], true);
    }

    protected function isEditableSale(Sale $sale): bool
    {
        if (! in_array($sale->status, ['draft', 'quotation', 'suspended', 'confirmed'], true)) {
            return false;
        }

        return $this->isWithinEditWindow($sale);
    }

    protected function isWithinEditWindow(Sale $sale): bool
    {
        $referenceDate = $sale->sale_date instanceof CarbonInterface
            ? $sale->sale_date->copy()->startOfDay()
            : $sale->created_at?->copy()->startOfDay();

        return app(EditWindowService::class)->isWithinWindow(
            $referenceDate,
            'sales',
            'edit_lifetime_days',
        );
    }
}
