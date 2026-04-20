<?php

namespace App\Policies;

use App\Models\ChartOfAccount;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class ChartOfAccountPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('accounting.coa')
            || $user->can('accounting.index')
            || $user->can('accounting.journals');
    }

    public function view(User $user, ChartOfAccount $chartOfAccount): bool
    {
        return (
            $user->can('accounting.coa')
            || $user->can('accounting.index')
            || $user->can('accounting.journals')
        )
            && $this->belongsToSameBusiness($user, $chartOfAccount);
    }

    public function create(User $user): bool
    {
        return $user->can('accounting.coa');
    }

    public function update(User $user, ChartOfAccount $chartOfAccount): bool
    {
        if (! $user->can('accounting.coa') || ! $this->belongsToSameBusiness($user, $chartOfAccount)) {
            return false;
        }

        return ! $chartOfAccount->is_system;
    }

    public function delete(User $user, ChartOfAccount $chartOfAccount): bool
    {
        if (! $user->can('accounting.coa') || ! $this->belongsToSameBusiness($user, $chartOfAccount)) {
            return false;
        }

        return ! $chartOfAccount->is_system;
    }
}
