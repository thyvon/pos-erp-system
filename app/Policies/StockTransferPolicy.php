<?php

namespace App\Policies;

use App\Models\StockTransfer;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

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
        $hasSourceAccess = $user->hasBranchAccess($transfer->fromWarehouse?->branch_id);
        $hasDestinationAccess = $user->hasBranchAccess($transfer->toWarehouse?->branch_id);

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
        $isOwner = (string) $transfer->created_by === (string) $user->id;
        $hasAdminBypass = $user->hasRole('admin');

        return ! $this->isPlatformOnlyUser($user)
            && $user->can('inventory.transfer')
            && $this->belongsToSameBusiness($user, $transfer)
            && in_array($transfer->status, ['pending', 'in_transit'], true)
            && ($isOwner || $hasAdminBypass)
            && $user->hasBranchAccess($transfer->fromWarehouse?->branch_id);
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
            && $user->hasBranchAccess($transfer->toWarehouse?->branch_id);
    }
}
