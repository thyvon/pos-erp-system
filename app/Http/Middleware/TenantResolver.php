<?php

namespace App\Http\Middleware;

use Closure;
use Throwable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class TenantResolver
{
    public function handle(Request $request, Closure $next): Response
    {
        app()->forgetInstance('tenant');

        $user = $request->user();
        $businessId = $user?->business_id;

        if (empty($businessId)) {
            return $next($request);
        }

        $tenant = $this->resolveTenant($businessId);

        if ($tenant !== null) {
            app()->instance('tenant', $tenant);
        }

        return $next($request);
    }

    protected function resolveTenant(string $businessId): ?object
    {
        $businessModel = $this->resolveBusinessModelClass();

        if ($businessModel === null) {
            return (object) ['id' => $businessId];
        }

        try {
            if (! Schema::hasTable('businesses')) {
                return (object) ['id' => $businessId];
            }

            return $businessModel::query()->find($businessId) ?: (object) ['id' => $businessId];
        } catch (Throwable) {
            return (object) ['id' => $businessId];
        }
    }

    protected function resolveBusinessModelClass(): ?string
    {
        foreach ([
            'App\\Models\\Foundation\\Business',
            'App\\Models\\Business',
        ] as $modelClass) {
            if (class_exists($modelClass)) {
                return $modelClass;
            }
        }

        return null;
    }
}
