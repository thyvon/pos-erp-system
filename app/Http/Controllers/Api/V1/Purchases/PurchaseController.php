<?php

namespace App\Http\Controllers\Api\V1\Purchases;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Purchases\ReceivePurchaseRequest;
use App\Http\Requests\Purchases\StorePurchaseRequest;
use App\Http\Requests\Purchases\UpdatePurchaseRequest;
use App\Http\Resources\Purchases\PurchaseResource;
use App\Models\Purchase;
use App\Services\Purchases\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends BaseApiController
{
    public function __construct(protected PurchaseService $purchases)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Purchase::class);

        $purchases = $this->purchases->paginate($request->only([
            'search',
            'branch_id',
            'warehouse_id',
            'supplier_id',
            'status',
            'payment_status',
            'date_from',
            'date_to',
            'per_page',
        ]), $request->user());

        return $this->paginated($purchases, PurchaseResource::class);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $this->authorize('create', Purchase::class);

        $purchase = $this->purchases->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new PurchaseResource($purchase), 'Purchase created successfully.', 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $this->authorize('view', $purchase);

        return $this->success(new PurchaseResource(
            $purchase->load(['branch', 'warehouse.branch', 'supplier', 'creator', 'receiver', 'items.product', 'items.variation'])
        ));
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('update', $purchase);

        $purchase = $this->purchases->update(
            $request->user()->business_id,
            $purchase,
            $request->validated(),
            $request->user()
        );

        return $this->success(new PurchaseResource($purchase), 'Purchase updated successfully.');
    }

    public function destroy(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('delete', $purchase);

        $this->purchases->delete($request->user()->business_id, $purchase, $request->user());

        return $this->success(null, 'Purchase deleted successfully.');
    }

    public function receive(ReceivePurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('receive', $purchase);

        $purchase = $this->purchases->receive(
            $request->user()->business_id,
            $purchase,
            $request->validated(),
            $request->user()
        );

        return $this->success(new PurchaseResource($purchase), 'Purchase received successfully.');
    }
}
