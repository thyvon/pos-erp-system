<?php

namespace App\Policies;

use App\Models\CashRegister;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class CashRegisterPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('sales.index');
    }

    public function view(User $user, CashRegister $cashRegister): bool
    {
        return $user->can('sales.index')
            && $this->belongsToSameBusiness($user, $cashRegister)
            && $user->hasBranchAccess($cashRegister->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['admin', 'manager']) && $user->can('sales.create');
    }

    public function update(User $user, CashRegister $cashRegister): bool
    {
        return $user->hasRole(['admin', 'manager'])
            && $user->can('sales.edit')
            && $this->belongsToSameBusiness($user, $cashRegister)
            && $user->hasBranchAccess($cashRegister->branch_id);
    }

    public function delete(User $user, CashRegister $cashRegister): bool
    {
        return $user->hasRole(['admin', 'manager'])
            && $user->can('sales.edit')
            && $this->belongsToSameBusiness($user, $cashRegister)
            && $user->hasBranchAccess($cashRegister->branch_id);
    }

    public function openSession(User $user, CashRegister $cashRegister): bool
    {
        return $user->hasRole(['admin', 'manager', 'cashier'])
            && $user->can('sales.create')
            && $this->belongsToSameBusiness($user, $cashRegister)
            && $user->hasBranchAccess($cashRegister->branch_id);
    }

    public function closeSession(User $user, CashRegister $cashRegister): bool
    {
        return $user->hasRole(['admin', 'manager', 'cashier'])
            && $user->can('sales.create')
            && $this->belongsToSameBusiness($user, $cashRegister)
            && $user->hasBranchAccess($cashRegister->branch_id);
    }
}
