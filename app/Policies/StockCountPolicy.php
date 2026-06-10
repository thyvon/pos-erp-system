<?php

namespace App\Policies;

use App\Models\StockCount;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;
use App\Services\Foundation\EditWindowService;

class StockCountPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('inventory.index');
    }

    public function view(User $user, StockCount $stockCount): bool
    {
        return $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $stockCount)
            && $user->hasWarehouseAccess($stockCount->warehouse_id);
    }

    public function create(User $user): bool
    {
        return $user->can('inventory.count');
    }

    public function complete(User $user, StockCount $stockCount): bool
    {
        return $user->can('inventory.count')
            && $this->belongsToSameBusiness($user, $stockCount)
            && $user->hasWarehouseAccess($stockCount->warehouse_id)
            && $this->withinEditWindow($stockCount)
            && $stockCount->status === 'in_progress';
    }

    public function record(User $user, StockCount $stockCount): bool
    {
        return $user->can('inventory.count')
            && $this->belongsToSameBusiness($user, $stockCount)
            && $user->hasWarehouseAccess($stockCount->warehouse_id)
            && $this->withinEditWindow($stockCount)
            && in_array($stockCount->status, ['in_progress', 'completed'], true);
    }

    public function delete(User $user, StockCount $stockCount): bool
    {
        return $user->can('inventory.count')
            && $this->belongsToSameBusiness($user, $stockCount)
            && $user->hasWarehouseAccess($stockCount->warehouse_id)
            && $this->withinEditWindow($stockCount)
            && $stockCount->status === 'in_progress';
    }

    protected function withinEditWindow(StockCount $stockCount): bool
    {
        return app(EditWindowService::class)->isWithinWindow(
            $stockCount->date ?? $stockCount->created_at,
            'stock',
            'count_edit_lifetime_days',
        );
    }
}
