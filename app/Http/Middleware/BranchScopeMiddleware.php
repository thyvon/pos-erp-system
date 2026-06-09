<?php

namespace App\Http\Middleware;

use App\Exceptions\Domain\DomainException;
use App\Models\Warehouse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BranchScopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        app()->forgetInstance('branch_scope');
        app()->forgetInstance('warehouse_scope');

        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        if ($this->shouldBypassRequirement($user)) {
            app()->instance('branch_scope', null);
            app()->instance('warehouse_scope', null);

            return $next($request);
        }

        $branchIds = array_values(array_unique($user->accessibleBranchIds()));

        if ($branchIds === []) {
            throw new DomainException('No branch access assigned. Contact your administrator.', 403);
        }

        app()->instance('branch_scope', $branchIds);

        $warehouseIds = array_values(array_unique($user->assignedWarehouseIds()));

        if ($warehouseIds === []) {
            $warehouseIds = Warehouse::withoutGlobalScopes()
                ->whereIn('branch_id', $branchIds)
                ->where('is_active', true)
                ->pluck('id')
                ->all();
        }

        app()->instance('warehouse_scope', $warehouseIds);

        return $next($request);
    }

    protected function shouldBypassRequirement(object $user): bool
    {
        if (! method_exists($user, 'hasRole')) {
            return false;
        }

        return $user->hasRole('super_admin');
    }
}
