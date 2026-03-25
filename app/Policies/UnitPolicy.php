<?php

namespace App\Policies;

use App\Models\Unit;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class UnitPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('units.index');
    }

    public function view(User $user, Unit $unit): bool
    {
        return $user->can('units.index')
            && $this->belongsToSameBusiness($user, $unit);
    }

    public function create(User $user): bool
    {
        return $user->can('units.create');
    }

    public function update(User $user, Unit $unit): bool
    {
        return $user->can('units.edit')
            && $this->belongsToSameBusiness($user, $unit);
    }

    public function delete(User $user, Unit $unit): bool
    {
        return $user->can('units.delete')
            && $this->belongsToSameBusiness($user, $unit);
    }
}
