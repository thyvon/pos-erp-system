<?php

namespace App\Policies;

use App\Models\Brand;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class BrandPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('brands.index');
    }

    public function view(User $user, Brand $brand): bool
    {
        return $user->can('brands.index')
            && $this->belongsToSameBusiness($user, $brand);
    }

    public function create(User $user): bool
    {
        return $user->can('brands.create');
    }

    public function update(User $user, Brand $brand): bool
    {
        return $user->can('brands.edit')
            && $this->belongsToSameBusiness($user, $brand);
    }

    public function delete(User $user, Brand $brand): bool
    {
        return $user->can('brands.delete')
            && $this->belongsToSameBusiness($user, $brand);
    }
}
