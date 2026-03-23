<?php

namespace App\Policies;

use App\Models\CustomFieldDefinition;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class CustomFieldDefinitionPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('custom_fields.index');
    }

    public function view(User $user, CustomFieldDefinition $definition): bool
    {
        return $user->can('custom_fields.index')
            && $this->belongsToSameBusiness($user, $definition);
    }

    public function create(User $user): bool
    {
        return $user->can('custom_fields.create');
    }

    public function update(User $user, CustomFieldDefinition $definition): bool
    {
        return $user->can('custom_fields.edit')
            && $this->belongsToSameBusiness($user, $definition);
    }

    public function delete(User $user, CustomFieldDefinition $definition): bool
    {
        return $user->can('custom_fields.delete')
            && $this->belongsToSameBusiness($user, $definition);
    }
}
