<?php

namespace App\Policies;

use App\Models\Supplier;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class SupplierPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('suppliers.index');
    }

    public function view(User $user, Supplier $supplier): bool
    {
        return $user->can('suppliers.index')
            && $this->belongsToSameBusiness($user, $supplier);
    }

    public function create(User $user): bool
    {
        return $user->can('suppliers.create');
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return $user->can('suppliers.edit')
            && $this->belongsToSameBusiness($user, $supplier);
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $user->can('suppliers.delete')
            && $this->belongsToSameBusiness($user, $supplier);
    }
}
