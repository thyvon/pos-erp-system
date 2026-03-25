<?php

namespace App\Policies;

use App\Models\CustomerGroup;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class CustomerGroupPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('customer_groups.index');
    }

    public function view(User $user, CustomerGroup $customerGroup): bool
    {
        return $user->can('customer_groups.index')
            && $this->belongsToSameBusiness($user, $customerGroup);
    }

    public function create(User $user): bool
    {
        return $user->can('customer_groups.create');
    }

    public function update(User $user, CustomerGroup $customerGroup): bool
    {
        return $user->can('customer_groups.edit')
            && $this->belongsToSameBusiness($user, $customerGroup);
    }

    public function delete(User $user, CustomerGroup $customerGroup): bool
    {
        return $user->can('customer_groups.delete')
            && $this->belongsToSameBusiness($user, $customerGroup);
    }
}
