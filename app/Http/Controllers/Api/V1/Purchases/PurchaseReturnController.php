<?php

namespace App\Http\Controllers\Api\V1\Purchases;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Purchases\StorePurchaseReturnRequest;
use App\Http\Resources\Purchases\PurchaseReturnResource;
use App\Models\Purchase;
use App\Services\Purchases\PurchaseReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PurchaseReturnController extends BaseApiController
{
    public function __construct(protected PurchaseReturnService $purchaseReturns)
    {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('purchases.return');

        $filters = $request->only([
            'search',
            'purchase_id',
            'branch_id',
            'warehouse_id',
            'date_from',
            'date_to',
            'page',
            'per_page',
        ]);

        $items = $this->purchaseReturns->paginate($filters);

        return $this->paginated($items, PurchaseReturnResource::class);
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('purchases.return');

        $purchaseReturn = $this->purchaseReturns->show($id);

        return $this->success(new PurchaseReturnResource($purchaseReturn));
    }

    public function store(StorePurchaseReturnRequest $request, Purchase $purchase): JsonResponse
    {
        $businessId = $request->user()->business_id;

        $purchaseReturn = $this->purchaseReturns->create(
            $businessId,
            $purchase,
            $request->validated(),
            $request->user(),
        );

        return $this->success(new PurchaseReturnResource($purchaseReturn), 'Purchase return recorded successfully.', 201);
    }
}
