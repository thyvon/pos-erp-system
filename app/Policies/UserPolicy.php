<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class UserPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('users.index');
    }

    public function view(User $user, User $model): bool
    {
        return $user->can('users.index') && $this->belongsToSameBusiness($user, $model);
    }

    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    public function update(User $user, User $model): bool
    {
        if (!$this->belongsToSameBusiness($user, $model)) {
            return false;
        }

        if ($model->hasRole('super_admin') && $user->id !== $model->id) {
            return false;
        }

        return $user->can('users.edit');
    }

    public function delete(User $user, User $model): bool
    {
        if (!$this->belongsToSameBusiness($user, $model)) {
            return false;
        }

        if ((string) $user->id === (string) $model->id) {
            return false;
        }

        if ($model->hasRole('super_admin')) {
            return false;
        }

        return $user->can('users.delete');
    }
}
