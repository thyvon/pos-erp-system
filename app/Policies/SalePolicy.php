<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;
use App\Services\Foundation\SettingsService;
use Carbon\CarbonInterface;
use Throwable;

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
            && $this->isEditableSale($sale);
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

        $lifetimeDays = $this->saleEditLifetimeDays();

        if ($lifetimeDays <= 0) {
            return true;
        }

        $referenceDate = $sale->sale_date instanceof CarbonInterface
            ? $sale->sale_date->copy()->startOfDay()
            : $sale->created_at?->copy()->startOfDay();

        if (! $referenceDate) {
            return true;
        }

        return now()->startOfDay()->diffInDays($referenceDate) <= $lifetimeDays;
    }

    protected function saleEditLifetimeDays(): int
    {
        try {
            return max(0, (int) app(SettingsService::class)->get('sales', 'edit_lifetime_days'));
        } catch (Throwable) {
            return 30;
        }
    }
}
