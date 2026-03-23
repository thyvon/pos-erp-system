<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('roles.index');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->can('roles.index') && $role->guard_name === 'web';
    }

    public function create(User $user): bool
    {
        return $user->can('roles.create');
    }

    public function update(User $user, Role $role): bool
    {
        return $user->can('roles.edit') && $role->guard_name === 'web';
    }

    public function delete(User $user, Role $role): bool
    {
        return $user->can('roles.delete') && $role->guard_name === 'web';
    }
}
