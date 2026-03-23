<?php

namespace App\Policies\Concerns;

use App\Models\User;

trait HandlesTenantPolicy
{
    protected function belongsToSameBusiness(User $user, mixed $model): bool
    {
        if (!isset($model->business_id) || $model->business_id === null || $user->business_id === null) {
            return true;
        }

        return (string) $user->business_id === (string) $model->business_id;
    }
}
