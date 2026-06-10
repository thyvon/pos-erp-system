<?php

namespace App\Policies;

use App\Models\StockTransfer;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;
use App\Services\Foundation\EditWindowService;

class StockTransferPolicy
{
    use HandlesTenantPolicy;

    protected function isPlatformOnlyUser(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function viewAny(User $user): bool
    {
        return ! $this->isPlatformOnlyUser($user)
            && $user->can('inventory.index');
    }

    public function view(User $user, StockTransfer $transfer): bool
    {
        $hasSourceAccess = $transfer->from_warehouse_id !== null && $user->hasWarehouseAccess($transfer->from_warehouse_id);
        $hasDestinationAccess = $transfer->to_warehouse_id !== null && $user->hasWarehouseAccess($transfer->to_warehouse_id);

        return ! $this->isPlatformOnlyUser($user)
            && $user->can('inventory.index')
            && $this->belongsToSameBusiness($user, $transfer)
            && (
                $hasSourceAccess
                || ($hasDestinationAccess && $transfer->status !== 'pending')
            );
    }

    public function create(User $user): bool
    {
        return ! $this->isPlatformOnlyUser($user)
            && $user->can('inventory.transfer');
    }

    public function update(User $user, StockTransfer $transfer): bool
    {
        return ! $this->isPlatformOnlyUser($user)
            && $user->can('inventory.transfer')
            && $this->belongsToSameBusiness($user, $transfer)
            && in_array($transfer->status, ['pending', 'in_transit'], true)
            && app(EditWindowService::class)->isWithinWindow($transfer->date ?? $transfer->created_at, 'stock', 'transfer_edit_lifetime_days')
            && $transfer->from_warehouse_id !== null && $user->hasWarehouseAccess($transfer->from_warehouse_id);
    }

    public function delete(User $user, StockTransfer $transfer): bool
    {
        return $this->update($user, $transfer);
    }

    public function receive(User $user, StockTransfer $transfer): bool
    {
        return ! $this->isPlatformOnlyUser($user)
            && $user->can('inventory.transfer')
            && $this->belongsToSameBusiness($user, $transfer)
            && $transfer->status === 'in_transit'
            && $transfer->to_warehouse_id !== null && $user->hasWarehouseAccess($transfer->to_warehouse_id);
    }
}
