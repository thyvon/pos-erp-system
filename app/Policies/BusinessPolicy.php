<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class BusinessPolicy
{
    use HandlesTenantPolicy;

    public function view(User $user, Business $business): bool
    {
        return $user->can('businesses.index')
            && $this->belongsToSameBusiness($user, $business);
    }

    public function update(User $user, Business $business): bool
    {
        return $user->can('businesses.edit')
            && $this->belongsToSameBusiness($user, $business);
    }
}
