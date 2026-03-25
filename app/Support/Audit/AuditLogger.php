<?php

namespace App\Support\Audit;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class AuditLogger
{
    public function log(
        string $event,
        string $auditableType,
        string $auditableId,
        ?User $actor = null,
        ?string $businessId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): void {
        try {
            if (! Schema::hasTable('audit_logs')) {
                return;
            }

            $resolvedBusinessId = $businessId ?? $actor?->business_id;

            if (! filled($resolvedBusinessId)) {
                return;
            }

            DB::table('audit_logs')->insert([
                'id' => (string) Str::uuid(),
                'business_id' => $resolvedBusinessId,
                'user_id' => $actor?->id,
                'event' => $event,
                'auditable_type' => $auditableType,
                'auditable_id' => $auditableId,
                'old_values' => $oldValues === null ? null : json_encode($oldValues, JSON_THROW_ON_ERROR),
                'new_values' => $newValues === null ? null : json_encode($newValues, JSON_THROW_ON_ERROR),
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
                'created_at' => now(),
            ]);
        } catch (Throwable) {
            // Audit writes must never block the main business operation.
        }
    }
}
