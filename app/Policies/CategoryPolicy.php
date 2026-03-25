<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class CategoryPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('categories.index');
    }

    public function view(User $user, Category $category): bool
    {
        return $user->can('categories.index')
            && $this->belongsToSameBusiness($user, $category);
    }

    public function create(User $user): bool
    {
        return $user->can('categories.create');
    }

    public function update(User $user, Category $category): bool
    {
        return $user->can('categories.edit')
            && $this->belongsToSameBusiness($user, $category);
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->can('categories.delete')
            && $this->belongsToSameBusiness($user, $category);
    }
}
