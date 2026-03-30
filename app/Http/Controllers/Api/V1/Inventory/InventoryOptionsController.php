<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\Product;
use App\Models\Warehouse;
use App\Support\BranchAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryOptionsController extends BaseApiController
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $businessId = $user->business_id;

        $products = Product::query()
            ->select(['id', 'name', 'sku', 'type'])
            ->where('track_inventory', true)
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'type' => $product->type,
            ])
            ->values();

        $branchScopedWarehouses = Warehouse::query()
            ->select(['id', 'name', 'code', 'branch_id'])
            ->where('is_active', true)
            ->when(! $user->hasRole('super_admin'), function ($query) use ($user): void {
                BranchAccess::scopeBranchQuery($query, $user, 'branch_id');
            })
            ->with('branch:id,name')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(fn (Warehouse $warehouse) => [
                'id' => $warehouse->id,
                'name' => $warehouse->name,
                'code' => $warehouse->code,
                'branch_id' => $warehouse->branch_id,
                'branch_name' => $warehouse->branch?->name,
            ])
            ->values();

        $transferDestinationWarehouses = Warehouse::withoutGlobalScopes()
            ->select(['id', 'name', 'code', 'branch_id'])
            ->where('business_id', $businessId)
            ->where('is_active', true)
            ->with('branch:id,name')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(fn (Warehouse $warehouse) => [
                'id' => $warehouse->id,
                'name' => $warehouse->name,
                'code' => $warehouse->code,
                'branch_id' => $warehouse->branch_id,
                'branch_name' => $warehouse->branch?->name,
            ])
            ->values();

        return $this->success([
            'products' => $products,
            'warehouses' => $branchScopedWarehouses,
            'transfer_from_warehouses' => $branchScopedWarehouses,
            'transfer_to_warehouses' => $transferDestinationWarehouses,
        ]);
    }
}
