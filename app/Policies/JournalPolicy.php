<?php

namespace App\Policies;

use App\Models\Journal;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class JournalPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('accounting.journals') || $user->can('accounting.index');
    }

    public function view(User $user, Journal $journal): bool
    {
        return ($user->can('accounting.journals') || $user->can('accounting.index'))
            && $this->belongsToSameBusiness($user, $journal);
    }

    public function create(User $user): bool
    {
        return $user->can('accounting.journals') || $user->can('accounting.index');
    }

    public function reverse(User $user, Journal $journal): bool
    {
        return ($user->hasRole('admin') || $user->hasRole('accountant'))
            && ($user->can('accounting.journals') || $user->can('accounting.index'))
            && $this->belongsToSameBusiness($user, $journal);
    }

    public function delete(User $user, Journal $journal): bool
    {
        return false;
    }
}
