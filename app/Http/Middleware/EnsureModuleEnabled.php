<?php

namespace App\Http\Middleware;

use App\Exceptions\Domain\DomainException;
use App\Services\Core\ModuleService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleEnabled
{
    public function __construct(protected ModuleService $modules)
    {
    }

    public function handle(Request $request, Closure $next, string ...$moduleKeys): Response
    {
        $user = $request->user();

        if ($user?->hasRole('super_admin')) {
            return $next($request);
        }

        $tenant = app()->bound('tenant') ? app('tenant') : null;
        $businessId = $user?->business_id ?? $tenant?->id;

        foreach ($moduleKeys as $moduleKey) {
            if ($this->modules->isEnabledForBusiness($businessId, $moduleKey)) {
                continue;
            }

            throw new DomainException(
                __('The :module module is not enabled for this business.', [
                    'module' => $this->modules->displayName($moduleKey),
                ]),
                403
            );
        }

        return $next($request);
    }
}
