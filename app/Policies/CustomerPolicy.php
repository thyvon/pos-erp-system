<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class CustomerPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('customers.index');
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user->can('customers.index')
            && $this->belongsToSameBusiness($user, $customer);
    }

    public function create(User $user): bool
    {
        return $user->can('customers.create');
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->can('customers.edit')
            && $this->belongsToSameBusiness($user, $customer);
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $user->can('customers.delete')
            && $this->belongsToSameBusiness($user, $customer);
    }
}
