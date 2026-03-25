<?php

namespace App\Policies;

use App\Models\TaxGroup;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class TaxGroupPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('tax_groups.index');
    }

    public function view(User $user, TaxGroup $taxGroup): bool
    {
        return $user->can('tax_groups.index')
            && $this->belongsToSameBusiness($user, $taxGroup);
    }

    public function create(User $user): bool
    {
        return $user->can('tax_groups.create');
    }

    public function update(User $user, TaxGroup $taxGroup): bool
    {
        return $user->can('tax_groups.edit')
            && $this->belongsToSameBusiness($user, $taxGroup);
    }

    public function delete(User $user, TaxGroup $taxGroup): bool
    {
        return $user->can('tax_groups.delete')
            && $this->belongsToSameBusiness($user, $taxGroup);
    }
}
