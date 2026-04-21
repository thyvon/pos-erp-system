<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AuditService
{
    public function log(
        string $event,
        string $auditableType,
        string $auditableId,
        ?User $actor = null,
        ?string $businessId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $notes = null,
        ?string $branchId = null,
    ): void {
        try {
            if (! Schema::hasTable('audit_logs')) {
                return;
            }

            $resolvedBusinessId = $businessId
                ?? $actor?->business_id
                ?? ($this->resolveTenantId())
                ?? null;

            if (! filled($resolvedBusinessId)) {
                return;
            }

            DB::table('audit_logs')->insert([
                'id' => (string) str()->uuid(),
                'business_id' => $resolvedBusinessId,
                'branch_id' => $branchId ?? $this->resolveBranchId($oldValues, $newValues),
                'user_id' => $actor?->id,
                'event' => $event,
                'auditable_type' => $auditableType,
                'auditable_id' => $auditableId,
                'old_values' => $this->encodePayload($oldValues),
                'new_values' => $this->encodePayload($newValues),
                'notes' => $notes,
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
                'created_at' => now(),
            ]);
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    protected function encodePayload(?array $payload): ?string
    {
        if ($payload === null) {
            return null;
        }

        return json_encode(
            $this->sanitizePayload($payload),
            JSON_THROW_ON_ERROR
        );
    }

    protected function sanitizePayload(array $payload): array
    {
        $sanitized = [];

        foreach ($payload as $key => $value) {
            $normalizedKey = is_string($key) ? strtolower($key) : $key;

            if (is_string($normalizedKey) && $this->isSensitiveKey($normalizedKey)) {
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizePayload($value);

                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }

    protected function isSensitiveKey(string $key): bool
    {
        foreach ([
            'password',
            'password_confirmation',
            'remember_token',
            'token',
            'access_token',
            'refresh_token',
            'secret',
            'api_key',
        ] as $fragment) {
            if (str_contains($key, $fragment)) {
                return true;
            }
        }

        return false;
    }

    protected function resolveBranchId(?array $oldValues, ?array $newValues): ?string
    {
        foreach ([$newValues, $oldValues] as $payload) {
            if (is_string(data_get($payload, 'branch_id'))) {
                return data_get($payload, 'branch_id');
            }
        }

        $requestBranchId = request()?->input('branch_id');

        if (is_string($requestBranchId) && $requestBranchId !== '') {
            return $requestBranchId;
        }

        if (! app()->bound('branch_scope')) {
            return null;
        }

        $branchScope = app('branch_scope');

        if (! is_array($branchScope) || count($branchScope) !== 1) {
            return null;
        }

        return $branchScope[0];
    }

    protected function resolveTenantId(): ?string
    {
        if (! app()->bound('tenant')) {
            return null;
        }

        return app('tenant')->id ?? null;
    }
}
