<?php

namespace App\Http\Middleware;

use App\Exceptions\Domain\DomainException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BranchScopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        app()->forgetInstance('branch_scope');

        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        if (method_exists($user, 'hasRole') && $user->hasRole(['super_admin', 'admin'])) {
            app()->instance('branch_scope', null);

            return $next($request);
        }

        if ($this->shouldBypassBranchRequirement($request, $user)) {
            app()->instance('branch_scope', null);

            return $next($request);
        }

        $branchIds = array_values(array_unique($user->accessibleBranchIds()));

        if ($branchIds === []) {
            throw new DomainException('No branch access assigned. Contact your administrator.', 403);
        }

        app()->instance('branch_scope', $branchIds);

        return $next($request);
    }

    protected function shouldBypassBranchRequirement(Request $request, object $user): bool
    {
        if (! method_exists($user, 'hasRole') || ! $user->hasRole('accountant')) {
            return false;
        }

        foreach ([
            'api/v1/accounting',
            'api/v1/accounting/*',
        ] as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        return false;
    }
}
