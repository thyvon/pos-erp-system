<?php

namespace App\Policies;

use App\Models\RackLocation;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class RackLocationPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('rack_locations.index');
    }

    public function view(User $user, RackLocation $rackLocation): bool
    {
        return $user->can('rack_locations.index')
            && $this->belongsToSameBusiness($user, $rackLocation)
            && $user->hasBranchAccess($rackLocation->warehouse->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('rack_locations.create');
    }

    public function update(User $user, RackLocation $rackLocation): bool
    {
        return $user->can('rack_locations.edit')
            && $this->belongsToSameBusiness($user, $rackLocation)
            && $user->hasBranchAccess($rackLocation->warehouse->branch_id);
    }

    public function delete(User $user, RackLocation $rackLocation): bool
    {
        return $user->can('rack_locations.delete')
            && $this->belongsToSameBusiness($user, $rackLocation)
            && $user->hasBranchAccess($rackLocation->warehouse->branch_id);
    }
}
