<?php

namespace App\Policies;

use App\Models\PaymentAccount;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class PaymentAccountPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('accounting.index');
    }

    public function view(User $user, PaymentAccount $paymentAccount): bool
    {
        return $user->can('accounting.index')
            && $this->belongsToSameBusiness($user, $paymentAccount);
    }

    public function create(User $user): bool
    {
        return $user->can('accounting.index');
    }

    public function update(User $user, PaymentAccount $paymentAccount): bool
    {
        return $user->can('accounting.index')
            && $this->belongsToSameBusiness($user, $paymentAccount);
    }

    public function delete(User $user, PaymentAccount $paymentAccount): bool
    {
        return $user->can('accounting.index')
            && $this->belongsToSameBusiness($user, $paymentAccount);
    }

    public function transfer(User $user): bool
    {
        return $user->can('accounting.index');
    }
}
