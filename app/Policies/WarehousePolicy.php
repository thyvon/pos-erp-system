<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Warehouse;
use App\Policies\Concerns\HandlesTenantPolicy;

class WarehousePolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('warehouses.index');
    }

    public function view(User $user, Warehouse $warehouse): bool
    {
        return $user->can('warehouses.index')
            && $this->belongsToSameBusiness($user, $warehouse)
            && $user->hasBranchAccess($warehouse->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('warehouses.create');
    }

    public function update(User $user, Warehouse $warehouse): bool
    {
        return $user->can('warehouses.edit')
            && $this->belongsToSameBusiness($user, $warehouse)
            && $user->hasBranchAccess($warehouse->branch_id);
    }

    public function delete(User $user, Warehouse $warehouse): bool
    {
        return $user->can('warehouses.delete')
            && $this->belongsToSameBusiness($user, $warehouse)
            && $user->hasBranchAccess($warehouse->branch_id);
    }
}
