<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;
use App\Policies\Concerns\HandlesTenantPolicy;

class AuditLogPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('audit_logs.index');
    }

    public function view(User $user, AuditLog $auditLog): bool
    {
        return $user->can('audit_logs.index')
            && $this->belongsToSameBusiness($user, $auditLog);
    }
}
