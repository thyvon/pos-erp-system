<?php

namespace App\Policies;

use App\Models\TaxRate;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class TaxRatePolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('tax_rates.index');
    }

    public function view(User $user, TaxRate $taxRate): bool
    {
        return $user->can('tax_rates.index')
            && $this->belongsToSameBusiness($user, $taxRate);
    }

    public function create(User $user): bool
    {
        return $user->can('tax_rates.create');
    }

    public function update(User $user, TaxRate $taxRate): bool
    {
        return $user->can('tax_rates.edit')
            && $this->belongsToSameBusiness($user, $taxRate);
    }

    public function delete(User $user, TaxRate $taxRate): bool
    {
        return $user->can('tax_rates.delete')
            && $this->belongsToSameBusiness($user, $taxRate);
    }
}
