<?php

namespace App\Policies;

use App\Models\StockAdjustment;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;
use App\Services\Foundation\EditWindowService;

class StockAdjustmentPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockAdjustment $adjustment): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $adjustment)
            && $user->hasBranchAccess($adjustment->warehouse?->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('inventory.adjust');
    }

    public function update(User $user, StockAdjustment $adjustment): bool
    {
        return $user->can('inventory.adjust')
            && $this->belongsToSameBusiness($user, $adjustment)
            && $user->hasBranchAccess($adjustment->warehouse?->branch_id)
            && app(EditWindowService::class)->isWithinWindow(
                $adjustment->date ?? $adjustment->created_at,
                'stock',
                'adjustment_edit_lifetime_days',
            );
    }
}
