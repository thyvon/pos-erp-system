<?php

namespace App\Policies;

use App\Models\FiscalYear;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class FiscalYearPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('accounting.index') || $user->can('accounting.journals');
    }

    public function view(User $user, FiscalYear $fiscalYear): bool
    {
        return ($user->can('accounting.index') || $user->can('accounting.journals'))
            && $this->belongsToSameBusiness($user, $fiscalYear);
    }

    public function create(User $user): bool
    {
        return $user->can('accounting.index');
    }

    public function update(User $user, FiscalYear $fiscalYear): bool
    {
        return $user->can('accounting.index')
            && $this->belongsToSameBusiness($user, $fiscalYear);
    }

    public function delete(User $user, FiscalYear $fiscalYear): bool
    {
        return $user->can('accounting.index')
            && $this->belongsToSameBusiness($user, $fiscalYear);
    }
}
