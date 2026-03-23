<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class BranchPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('branches.index');
    }

    public function view(User $user, Branch $branch): bool
    {
        return $user->can('branches.index')
            && $this->belongsToSameBusiness($user, $branch)
            && $user->hasBranchAccess($branch->id);
    }

    public function create(User $user): bool
    {
        return $user->can('branches.create');
    }

    public function update(User $user, Branch $branch): bool
    {
        return $user->can('branches.edit')
            && $this->belongsToSameBusiness($user, $branch)
            && $user->hasBranchAccess($branch->id);
    }

    public function delete(User $user, Branch $branch): bool
    {
        return $user->can('branches.delete')
            && $this->belongsToSameBusiness($user, $branch)
            && $user->hasBranchAccess($branch->id);
    }
}
