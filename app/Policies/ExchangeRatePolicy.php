<?php

namespace App\Policies;

use App\Models\ExchangeRate;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class ExchangeRatePolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('accounting.index') || $user->can('payments.create');
    }

    public function view(User $user, ExchangeRate $exchangeRate): bool
    {
        return ($user->can('accounting.index') || $user->can('payments.create'))
            && $this->belongsToSameBusiness($user, $exchangeRate);
    }

    public function create(User $user): bool
    {
        return $user->can('accounting.index');
    }

    public function update(User $user, ExchangeRate $exchangeRate): bool
    {
        return $user->can('accounting.index')
            && $this->belongsToSameBusiness($user, $exchangeRate);
    }

    public function delete(User $user, ExchangeRate $exchangeRate): bool
    {
        return $user->can('accounting.index')
            && $this->belongsToSameBusiness($user, $exchangeRate);
    }
}
