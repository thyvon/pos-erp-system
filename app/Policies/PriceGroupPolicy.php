<?php

namespace App\Policies;

use App\Models\PriceGroup;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class PriceGroupPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('price_groups.index');
    }

    public function view(User $user, PriceGroup $priceGroup): bool
    {
        return $user->can('price_groups.index')
            && $this->belongsToSameBusiness($user, $priceGroup);
    }

    public function create(User $user): bool
    {
        return $user->can('price_groups.create');
    }

    public function update(User $user, PriceGroup $priceGroup): bool
    {
        return $user->can('price_groups.edit')
            && $this->belongsToSameBusiness($user, $priceGroup);
    }

    public function delete(User $user, PriceGroup $priceGroup): bool
    {
        return $user->can('price_groups.delete')
            && $this->belongsToSameBusiness($user, $priceGroup);
    }
}
