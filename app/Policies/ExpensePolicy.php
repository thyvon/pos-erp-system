<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class ExpensePolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('expenses.index');
    }

    public function view(User $user, Expense $expense): bool
    {
        return $user->can('expenses.index')
            && $this->belongsToSameBusiness($user, $expense)
            && $user->hasBranchAccess($expense->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->can('expenses.create');
    }

    public function update(User $user, Expense $expense): bool
    {
        return $user->can('expenses.edit')
            && $this->belongsToSameBusiness($user, $expense)
            && $user->hasBranchAccess($expense->branch_id);
    }

    public function delete(User $user, Expense $expense): bool
    {
        return $user->can('expenses.delete')
            && $this->belongsToSameBusiness($user, $expense)
            && $user->hasBranchAccess($expense->branch_id);
    }
}
