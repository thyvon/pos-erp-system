<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class ProductPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('products.index');
    }

    public function view(User $user, Product $product): bool
    {
        return $user->can('products.index')
            && $this->belongsToSameBusiness($user, $product);
    }

    public function create(User $user): bool
    {
        return $user->can('products.create');
    }

    public function update(User $user, Product $product): bool
    {
        return $user->can('products.edit')
            && $this->belongsToSameBusiness($user, $product);
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->can('products.delete')
            && $this->belongsToSameBusiness($user, $product);
    }
}
